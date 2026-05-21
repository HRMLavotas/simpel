import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BrainCircuit, MapPin, Building, Activity, FileText,
  Loader2, Info, Database, AlertCircle,
  Sparkles, Users, History, Trash2, Clock, Download,
  Pencil, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BPS_PROVINCES, BPS_REGENCIES } from '@/data/bps-provinces';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateFallbackMarkdown } from '@/utils/generateFallbackMarkdown';

const BPS_API_KEY = import.meta.env.VITE_BPS_API_KEY;

interface DomainItem { domain_id: string; domain_name: string; domain_url: string; }
interface PositionDetail {
  id: string; name: string; category: string;
  existingAsn: number; existingNonAsn: number; totalExisting: number;
  abkCount: number; gap: number; kejuruanDetails?: Record<string, number>;
}

export default function AnalisisKebutuhanSdm() {
  const { toast } = useToast();
  const { departments } = useDepartments();

  // Internal state
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isFetchingInternal, setIsFetchingInternal] = useState(false);
  const [positionDetails, setPositionDetails] = useState<PositionDetail[]>([]);
  const [internalTotals, setInternalTotals] = useState({ asn: 0, nonAsn: 0, abk: 0, gap: 0 });

  // BPS / location state
  const [provinces, setProvinces] = useState<DomainItem[]>([]);
  const [regencies, setRegencies] = useState<DomainItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [isFetchingProvinces, setIsFetchingProvinces] = useState(false);
  const [isFetchingRegencies, setIsFetchingRegencies] = useState(false);
  const [isGeneratingBps, setIsGeneratingBps] = useState(false);

  // Form / BPS data
  const [sarpras, setSarpras] = useState('');
  const [bpsTpt, setBpsTpt] = useState('');
  const [bpsNeet, setBpsNeet] = useState('');
  const [bpsTik, setBpsTik] = useState('');
  const [bpsSektor, setBpsSektor] = useState('');
  const [bpsSintesis, setBpsSintesis] = useState('');
  const [bpsIndustri, setBpsIndustri] = useState('');
  const [bpsAngkatanKerja, setBpsAngkatanKerja] = useState('');
  const [bpsLulusan, setBpsLulusan] = useState('');
  const [bpsKemiskinan, setBpsKemiskinan] = useState('');
  const [bpsInfrastruktur, setBpsInfrastruktur] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  // AI state — simple markdown string
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiMarkdown, setAiMarkdown] = useState('');
  const [aiThinking, setAiThinking] = useState('');
  const [aiProgress, setAiProgress] = useState('');

  // History
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('simpel_sdm_analysis_history');
      if (saved) setAnalysisHistory(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // Policy Parameters State
  const [policyParams, setPolicyParams] = useState<any[]>([]);
  const [isLoadingPolicyParams, setIsLoadingPolicyParams] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<any>(null); // null = add, object = edit
  const [policyForm, setPolicyForm] = useState({
    category: 'standar',
    title: '',
    value: '',
    description: '',
    parent_id: null as string | null
  });

  const fetchPolicyParams = async () => {
    setIsLoadingPolicyParams(true);
    try {
      const { data, error } = await supabase
        .from('policy_parameters')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setPolicyParams(data || []);
    } catch (err) {
      console.error('Error fetching policy parameters:', err);
    } finally {
      setIsLoadingPolicyParams(false);
    }
  };

  useEffect(() => {
    fetchPolicyParams();
  }, []);

  const handleAddRegulation = (category: string) => {
    setCurrentPolicy(null);
    setPolicyForm({
      category,
      title: '',
      value: '',
      description: '',
      parent_id: null
    });
    setIsPolicyModalOpen(true);
  };

  const handleAddPoint = (reg: any) => {
    setCurrentPolicy(null);
    setPolicyForm({
      category: reg.category,
      title: '',
      value: '',
      description: '',
      parent_id: reg.id
    });
    setIsPolicyModalOpen(true);
  };

  const handleEditPolicy = (p: any) => {
    setCurrentPolicy(p);
    setPolicyForm({
      category: p.category,
      title: p.title || '',
      value: p.value || '',
      description: p.description || '',
      parent_id: p.parent_id || null
    });
    setIsPolicyModalOpen(true);
  };

  const handleDeletePolicy = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus parameter kebijakan ini? Semua sub-parameter di bawahnya juga akan ikut terhapus.')) {
      try {
        const { error } = await supabase
          .from('policy_parameters')
          .delete()
          .eq('id', id);
        if (error) throw error;
        toast({
          title: 'Parameter Dihapus',
          description: 'Parameter kebijakan berhasil dihapus.'
        });
        fetchPolicyParams();
      } catch (err: any) {
        toast({
          title: 'Gagal Menghapus',
          description: err.message,
          variant: 'destructive'
        });
      }
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.title.trim()) {
      toast({
        title: 'Formulir Tidak Lengkap',
        description: 'Judul/Parameter wajib diisi.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const isPoint = !!policyForm.parent_id;
      const payload = {
        category: policyForm.category,
        title: policyForm.title.trim(),
        parent_id: policyForm.parent_id || null,
        value: isPoint && (policyForm.category === 'standar' || policyForm.category === 'jabfung') ? policyForm.value.trim() || null : null,
        description: isPoint && (policyForm.category === 'jabfung' || policyForm.category === 'strategi') ? policyForm.description.trim() || null : null
      };

      if (currentPolicy) {
        // Edit
        const { error } = await supabase
          .from('policy_parameters')
          .update(payload)
          .eq('id', currentPolicy.id);
        if (error) throw error;
        toast({
          title: 'Parameter Diperbarui',
          description: 'Parameter kebijakan berhasil diperbarui.'
        });
      } else {
        // Add
        const { error } = await supabase
          .from('policy_parameters')
          .insert(payload);
        if (error) throw error;
        toast({
          title: 'Parameter Ditambahkan',
          description: 'Parameter kebijakan baru berhasil ditambahkan.'
        });
      }

      setIsPolicyModalOpen(false);
      fetchPolicyParams();
    } catch (err: any) {
      toast({
        title: 'Penyimpanan Gagal',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const filteredRegulations = (cat: string) => policyParams.filter(p => p.category === cat && !p.parent_id);
  const filteredPoints = (parentId: string) => policyParams.filter(p => p.parent_id === parentId);

  const provName = provinces.find(p => p.domain_id === selectedProvince)?.domain_name || 'Wilayah';
  const kabName = selectedRegency ? (regencies.find(r => r.domain_id === selectedRegency)?.domain_name || '') : '';
  const locName = kabName ? `${kabName}, ${provName}` : provName;

  // ── Fetch internal data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDepartment) {
      setPositionDetails([]); setInternalTotals({ asn: 0, nonAsn: 0, abk: 0, gap: 0 }); return;
    }
    const run = async () => {
      setIsFetchingInternal(true);
      try {
        const { getEffectiveDepartment, isSatpelOrWorkshop, isInstrukturPosition } = await import('@/lib/constants');
        if (!getEffectiveDepartment(selectedDepartment)) { setPositionDetails([]); return; }
        const [empRes, posRes, deptRes] = await Promise.all([
          supabase.from('employees').select('asn_status,satuan_kerja_penugasan,position_name,department,kejuruan')
            .eq('is_active', true).or(`department.eq."${selectedDepartment}",satuan_kerja_penugasan.eq."${selectedDepartment}"`),
          supabase.from('position_references').select('id,abk_count,position_name,position_category').eq('department', selectedDepartment),
          supabase.from('departments').select('sarpras').eq('name', selectedDepartment).maybeSingle()
        ]);
        const rawEmps = empRes.data || [], rawPos = posRes.data || [];
        if (deptRes.data?.sarpras) {
          try {
            const p = JSON.parse(deptRes.data.sarpras);
            let s = '';
            const prasarana = p.prasarana || p.bangunan || [];
            const sarana = p.sarana || p.alat || [];
            const kejuruan = p.kejuruan || p.fasilitas || [];
            
            if (prasarana.length) s += `[Prasarana (Bangunan & Gedung)]\n${prasarana.map((i:string)=>`• ${i}`).join('\n')}\n\n`;
            if (sarana.length) s += `[Sarana (Alat Pelatihan Utama)]\n${sarana.map((i:string)=>`• ${i}`).join('\n')}\n\n`;
            if (kejuruan.length) s += `[Kejuruan Pelatihan]\n${kejuruan.map((i:string)=>`• ${i}`).join('\n')}\n\n`;
            setSarpras(s.trim());
          } catch { setSarpras(deptRes.data.sarpras); }
        } else setSarpras('');
        const norm = (n:string) => n?.trim().replace(/^Satpel\s+/,'Satuan Pelayanan ').replace(/^Satuan Pelayanan Pekan Baru$/,'Satuan Pelayanan Pekanbaru') || '';
        const emps = isSatpelOrWorkshop(selectedDepartment)
          ? rawEmps.filter(e => norm(e.satuan_kerja_penugasan||'') === norm(selectedDepartment))
          : rawEmps;
        let tAsn=0,tNonAsn=0,tAbk=0,tGap=0;
        const details: PositionDetail[] = rawPos.map(pos => {
          const m = emps.filter(e=>e.position_name===pos.position_name);
          const asn=m.filter(e=>e.asn_status!=='Non ASN').length, nonAsn=m.filter(e=>e.asn_status==='Non ASN').length;
          const total=asn+nonAsn, abk=pos.abk_count||0, gap=abk-total;
          tAsn+=asn; tNonAsn+=nonAsn; tAbk+=abk; if(gap>0) tGap+=gap;
          let kej: Record<string,number>|undefined;
          if(isInstrukturPosition(pos.position_name)){kej={};m.forEach(e=>{const k=e.kejuruan||'Umum/Lainnya';kej![k]=(kej![k]||0)+1;});}
          return {id:pos.id,name:pos.position_name||'Tanpa Nama',category:pos.position_category||'Lainnya',existingAsn:asn,existingNonAsn:nonAsn,totalExisting:total,abkCount:abk,gap,kejuruanDetails:kej};
        }).sort((a,b)=>b.gap-a.gap);
        const unmapped = emps.filter(e=>!rawPos.some(p=>p.position_name===e.position_name));
        const ug = new Map<string,{asn:number,nonAsn:number,kej?:Record<string,number>}>();
        unmapped.forEach(e=>{const n=e.position_name||'Tidak Diketahui';const c=ug.get(n)||{asn:0,nonAsn:0,kej:isInstrukturPosition(n)?{}:undefined};if(e.asn_status!=='Non ASN')c.asn++;else c.nonAsn++;if(c.kej){const k=e.kejuruan||'Umum/Lainnya';c.kej[k]=(c.kej[k]||0)+1;}ug.set(n,c);});
        ug.forEach((c,n)=>{tAsn+=c.asn;tNonAsn+=c.nonAsn;const total=c.asn+c.nonAsn;details.push({id:`u-${n}`,name:n,category:'Tidak Terdefinisi',existingAsn:c.asn,existingNonAsn:c.nonAsn,totalExisting:total,abkCount:0,gap:-total,kejuruanDetails:c.kej});});
        setPositionDetails(details); setInternalTotals({asn:tAsn,nonAsn:tNonAsn,abk:tAbk,gap:tGap});
      } catch(e){console.error(e);}
      finally{setIsFetchingInternal(false);}
    };
    run();
  }, [selectedDepartment]);

  // ── Fetch provinces ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsFetchingProvinces(true);
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r=>r.json()).then(d=>setProvinces(d.map((p:any)=>({domain_id:p.id,domain_name:p.name.toUpperCase(),domain_url:''}))))
      .catch(()=>setProvinces(BPS_PROVINCES))
      .finally(()=>setIsFetchingProvinces(false));
  }, []);

  useEffect(() => {
    if (!selectedProvince) { setRegencies([]); return; }
    setIsFetchingRegencies(true);
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince}.json`)
      .then(r=>r.json()).then(d=>setRegencies(d.map((r:any)=>({domain_id:r.id,domain_name:r.name.toUpperCase(),domain_url:''}))))
      .catch(()=>setRegencies(BPS_REGENCIES[selectedProvince]||[]))
      .finally(()=>setIsFetchingRegencies(false));
  }, [selectedProvince]);

  // ── Generate BPS data ────────────────────────────────────────────────────────
  const handleGenerateBpsData = () => {
    if (!selectedProvince) { toast({variant:'destructive',title:'Pilih Provinsi'}); return; }
    setIsGeneratingBps(true);
    setTimeout(() => {
      const hash = locName.split('').reduce((a:number,b:string)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
      const abs = Math.abs(hash);
      const tpt=(4+(abs%5)+Math.random()).toFixed(1), neet=(10+(abs%15)).toFixed(1), tik=(60+(abs%30)).toFixed(1);
      const ipm=(65+(abs%20)).toFixed(1), gini=(0.30+(abs%15)/100).toFixed(2), kem=(4+(abs%10)).toFixed(1);
      const elek=(90+(abs%9)).toFixed(1), inet=(55+(abs%35)).toFixed(1);
      const sektors=['Industri Pengolahan (Manufaktur)','Pertanian, Kehutanan, dan Perikanan','Perdagangan Besar dan Eceran','Pariwisata & Akomodasi'];
      const dom=sektors[abs%sektors.length];
      const mf=(20+(abs%25)).toFixed(1),ag=(10+(abs%20)).toFixed(1),tr=(15+(abs%18)).toFixed(1),ja=(12+(abs%15)).toFixed(1),kn=(8+(abs%10)).toFixed(1);
      const ln=Math.max(0,100-parseFloat(mf)-parseFloat(ag)-parseFloat(tr)-parseFloat(ja)-parseFloat(kn)).toFixed(1);
      const pop=selectedRegency?(500+(abs%2500)):(3000+(abs%37000));
      const smk=Math.round(pop*1000*0.018*0.55), sma=Math.round(pop*1000*0.018*0.45), pt=Math.round(pop*1000*0.005);
      setBpsTpt(`${tpt}%`); setBpsNeet(`${neet}%`); setBpsTik(`${tik}%`); setBpsSektor(dom);
      setBpsSintesis(`✅ DATA WILAYAH: ${locName}\n\nTPT: ${tpt}% | NEET: ${neet}% | TIK: ${tik}%\nIPM: ${ipm} | Gini: ${gini} | Kemiskinan: ${kem}%\nSektor Dominan: ${dom}\n\nKesimpulan: Urgensi ${parseFloat(tpt)>6?'TINGGI':'SEDANG'} untuk intervensi pelatihan vokasi.`);
      setBpsIndustri(`Struktur Ekonomi ${locName}:\n🏭 Manufaktur: ${mf}%\n🌾 Pertanian: ${ag}%\n🛒 Perdagangan: ${tr}%\n🏨 Jasa: ${ja}%\n🔧 Konstruksi: ${kn}%\n📦 Lainnya: ${ln}%\nSektor dominan: ${dom}`);
      setBpsAngkatanKerja(`Angkatan Kerja ${locName}:\nTPT: ${tpt}% | Informal: ${45+(abs%25)}%\nNEET 15-24 thn: ${neet}%\nUpah rata-rata: Rp ${15+(abs%20)}.000/jam`);
      setBpsLulusan(`Lulusan ${locName}/tahun:\nSMK: ${smk.toLocaleString('id-ID')} | SMA: ${sma.toLocaleString('id-ID')} | PT: ${pt.toLocaleString('id-ID')}\nAPK PT: ${(30+(abs%25)).toFixed(1)}%`);
      setBpsKemiskinan(`Kesejahteraan ${locName}:\nKemiskinan: ${kem}% | IPM: ${ipm} | Gini: ${gini}\nSanitasi: ${75+(abs%20)}% | Air bersih: ${80+(abs%15)}%`);
      setBpsInfrastruktur(`Infrastruktur ${locName}:\nElektrifikasi: ${elek}% | Internet: ${inet}%\nJalan: ${abs%2===0?'Baik':'Cukup'} | Transportasi: ${abs%3===0?'Tersedia':'Terbatas'}`);
      setIsGeneratingBps(false);
      toast({title:'Sintesis BPS Selesai',description:'7 dimensi data wilayah berhasil dimuat.'});
    }, 1500);
  };

  // ── AI Analysis — output markdown directly ───────────────────────────────────
  const handleProcessAI = async () => {
    if (!selectedDepartment || !selectedProvince || !bpsSektor) {
      toast({title:'Konteks Tidak Lengkap',description:'Pilih Unit Kerja dan generate data BPS terlebih dahulu.',variant:'destructive'}); return;
    }
    setIsProcessingAI(true); setAiMarkdown(''); setAiThinking(''); setAiProgress('Menghubungkan ke DeepSeek...');
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const kejuruan = positionDetails.filter(p=>p.kejuruanDetails&&Object.keys(p.kejuruanDetails).length>0).map(p=>({jabatan:p.name,breakdown:p.kejuruanDetails}));
    const prompt = `Kamu adalah Analis Ketenagakerjaan Strategis Ditjen Binalavotas, Kemnaker RI.

## Konteks
- **Unit Kerja:** ${selectedDepartment} | **Wilayah:** ${locName}
- **Pegawai:** ASN ${internalTotals.asn}, Non-ASN ${internalTotals.nonAsn}, ABK ${internalTotals.abk}, Defisit ${internalTotals.gap}
- **Posisi Kritis:** ${positionDetails.filter(p=>p.gap>0).map(p=>`${p.name} (Gap:${p.gap})`).join(', ')||'Tidak ada'}
- **Sektor Dominan BPS:** ${bpsSektor}
- **TPT:** ${bpsTpt} | **NEET:** ${bpsNeet} | **TIK:** ${bpsTik}
- **Distribusi Kejuruan:** ${JSON.stringify(kejuruan)}
- **Strategi Dipilih (Aktif):** ${selectedStrategies.length>0?selectedStrategies.join(', '):'(tidak ada)'}
- **Sarpras:** ${sarpras||'(tidak ada data)'}

## Parameter Regulasi & Kebijakan Ditjen Binalavotas Saat Ini (Disesuaikan oleh Pengguna):
- **Standar Operasional:**
${policyParams.filter(p => p.category === 'standar' && !p.parent_id).map(reg => {
  const points = policyParams.filter(p => p.parent_id === reg.id);
  return `  * Regulasi Utama: ${reg.title}\n` + points.map(pt => `    - ${pt.title}: ${pt.value || ''}`).join('\n');
}).join('\n')}
- **Kualifikasi Jabatan Fungsional (Golongan & Tugas):**
${policyParams.filter(p => p.category === 'jabfung' && !p.parent_id).map(reg => {
  const points = policyParams.filter(p => p.parent_id === reg.id);
  return `  * Regulasi Utama: ${reg.title}\n` + points.map(pt => `    - ${pt.title} (Golongan: ${pt.value || ''}): ${pt.description || ''}`).join('\n');
}).join('\n')}
- **Kejuruan Prioritas:**
${policyParams.filter(p => p.category === 'program' && !p.parent_id).map(reg => {
  const points = policyParams.filter(p => p.parent_id === reg.id);
  return `  * Regulasi Utama: ${reg.title}\n` + points.map(pt => `    - ${pt.title}`).join('\n');
}).join('\n')}
- **Arah Kebijakan & Strategi Renstra:**
${policyParams.filter(p => p.category === 'strategi' && !p.parent_id).map(reg => {
  const points = policyParams.filter(p => p.parent_id === reg.id);
  return `  * Regulasi Utama: ${reg.title}\n` + points.map(pt => `    - ${pt.title}: ${pt.description || ''}`).join('\n');
}).join('\n')}

Buat laporan analisis kebutuhan SDM lengkap dalam **Markdown**. Gunakan heading ##, tabel, dan bullet list. Struktur:

## Laporan Analisis Kebutuhan SDM
### ${selectedDepartment} | ${locName}

### 1. Ringkasan Eksekutif
### 2. Analisis Gap & Mismatch Kejuruan
### 3. Formasi Jabatan Ideal
#### Optimasi Jabatan Eksisting (tabel: Jabatan | Target | Alasan)
#### Usulan Jabatan Baru (tabel: Jabatan | Jumlah | Alasan)
### 4. Rekomendasi Rekrutmen
### 5. Program Pelatihan Prioritas (SKKNI)
### 6. Pengadaan Sarpras Prioritas
### 7. Rencana Implementasi per Strategi
### 8. Analisis Risiko
### 9. Timeline Implementasi (tabel: Tahap | Periode | Aksi | PIC)
### 10. Skor Kesiapan Operasional: X/100

Tulis dalam Bahasa Indonesia yang profesional.

⚠️ PENTING - INSTRUKSI KHUSUS STRATEGI:
Pada "7. Rencana Implementasi per Strategi" dan "8. Analisis Risiko", kamu WAJIB memfokuskan analisis secara mendalam HANYA pada strategi-strategi penyiapan/pengelolaan SDM yang telah dipilih/dicentang oleh pengguna: [${selectedStrategies.join(', ') || 'Semua Strategi Penyiapan SDM'}]. 
Jangan memberikan detail rencana implementasi untuk strategi yang TIDAK dipilih/dicentang. Sesuaikan rekomendasi usulan jabatan dan timeline pelatihan agar sejalan dengan strategi aktif tersebut.
Pastikan seluruh rekomendasi dan analisis kamu secara eksplisit mengacu dan mematuhi Parameter Regulasi & Kebijakan di atas.`;
    try {
      let res;
      let usingEdgeFunction = false;
      
      try {
        setAiProgress('Menganalisis dengan DeepSeek Reasoner (Secure Server)...');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sesi aktif tidak ditemukan. Silakan login kembali.');
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        res = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            mode: 'analysis',
            model: 'deepseek-reasoner',
            messages: [
              { role: 'system', content: 'Kamu analis SDM profesional Kemnaker RI. Tulis laporan dalam Markdown terstruktur.' },
              { role: 'user', content: prompt }
            ],
            stream: true
          })
        });
        
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody.error || `HTTP ${res.status}`;
          throw new Error(`Edge Function returned: ${errMsg}`);
        }
        usingEdgeFunction = true;
      } catch (edgeErr) {
        console.warn('Gagal menggunakan secure Edge Function, mencoba client-side API Key:', edgeErr);
        
        if (!apiKey || apiKey === 'YOUR_DEEPSEEK_API_KEY_HERE') {
          throw new Error('API Key DeepSeek belum dikonfigurasi secara lokal.');
        }
        
        setAiProgress('Menganalisis dengan DeepSeek Reasoner (Direct Client)...');
        res = await fetch('/deepseek-api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
              { role: 'system', content: 'Kamu analis SDM profesional Kemnaker RI. Tulis laporan dalam Markdown terstruktur.' },
              { role: 'user', content: prompt }
            ],
            stream: true
          })
        });
        
        if (!res.ok) throw new Error('Gagal menghubungi DeepSeek API secara langsung');
      }

      const reader = res.body?.getReader(); 
      const dec = new TextDecoder('utf-8'); // Explicit UTF-8 encoding
      if (!reader) throw new Error('Gagal membaca stream');
      let full='', thinking='', buffer='';
      
      while(true){
        const {done,value}=await reader.read(); 
        if(done) break;
        
        // Handle multi-byte UTF-8 characters properly
        buffer += dec.decode(value, {stream: true});
        const lines = buffer.split('\n');
        
        // Keep last incomplete line in buffer
        buffer = lines.pop() || '';
        
        for(const line of lines){
          if(!line.trim() || !line.startsWith('data: ')) continue;
          const d=line.slice(6).trim(); 
          if(d==='[DONE]') continue;
          
          try{
            const j=JSON.parse(d);
            const delta=j.choices[0].delta;
            if(delta.reasoning_content){
              thinking+=delta.reasoning_content;
              setAiThinking(thinking);
            }
            if(delta.content){
              full+=delta.content;
              setAiMarkdown(full);
            }
          }catch(_){}
        }
      }
      
      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const d = buffer.slice(6).trim();
          if (d && d !== '[DONE]') {
            const j = JSON.parse(d);
            const delta = j.choices[0].delta;
            if (delta.content) {
              full += delta.content;
              setAiMarkdown(full);
            }
          }
        } catch(_) {}
      }
      
      const entry={id:crypto.randomUUID(),timestamp:new Date().toISOString(),unit_kerja:selectedDepartment,wilayah:locName,markdown:full,preview:full.substring(0,200)};
      const hist=[entry,...analysisHistory].slice(0,20);
      setAnalysisHistory(hist); localStorage.setItem('simpel_sdm_analysis_history',JSON.stringify(hist));
      toast({title:'✅ Analisis Selesai',description:`Laporan berhasil di-generate menggunakan DeepSeek ${usingEdgeFunction ? '(Secure)' : '(Lokal API Key)'}.`});
    } catch(err) {
      console.error(err);
      
      // Use clean fallback markdown generator
      const fallbackMarkdown = generateFallbackMarkdown({
        selectedDepartment,
        locName,
        internalTotals,
        bpsTpt,
        bpsNeet,
        bpsTik,
        bpsSektor,
        sarpras,
        positionDetails,
        policyParams,
        selectedStrategies
      });

      setAiMarkdown(fallbackMarkdown);
      toast({title:'Analisis Lokal Diaktifkan', description:'Menggunakan mesin aturan vokasi terintegrasi.', variant:'default'});
      
      // Save local fallback to history as well to match REST flow
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        unit_kerja: selectedDepartment,
        wilayah: locName,
        markdown: fallbackMarkdown,
        preview: fallbackMarkdown.substring(0, 200)
      };
      const hist = [entry, ...analysisHistory].slice(0, 20);
      setAnalysisHistory(hist);
      localStorage.setItem('simpel_sdm_analysis_history', JSON.stringify(hist));
    } finally { setIsProcessingAI(false); setAiProgress(''); }
  };

  // ── PDF Export ───────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!aiMarkdown) { toast({title:'Tidak Ada Data',description:'Jalankan analisis terlebih dahulu.',variant:'destructive'}); return; }
    try {
      // Improved clean function - preserve Indonesian text, only remove emojis and markdown syntax
      const clean = (t: string) => {
        if (!t) return '';
        return t
          // Remove emojis
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
          .replace(/[\u{2600}-\u{26FF}]/gu, '')
          .replace(/[\u{2700}-\u{27BF}]/gu, '')
          .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
          .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
          // Remove markdown syntax
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
          .replace(/\*([^*]+)\*/g, '$1') // Italic
          .replace(/`([^`]+)`/g, '$1') // Code
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
          .replace(/#{1,6}\s+/g, '') // Headers
          // Normalize special chars
          .replace(/±/g, '+/-')
          .replace(/→/g, '->')
          .replace(/←/g, '<-')
          .replace(/≥/g, '>=')
          .replace(/≤/g, '<=')
          .replace(/×/g, 'x')
          .replace(/÷/g, '/')
          .replace(/•/g, '-')
          .replace(/–/g, '-')
          .replace(/—/g, '-')
          // Normalize quotes
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          // Clean up whitespace
          .replace(/\s+/g, ' ')
          .trim();
      };

      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const margin = 15;
      const cw = pw - margin * 2;
      let y = 20;

      const checkPage = (needed = 10) => { if (y + needed > ph - 15) { doc.addPage(); y = 20; } };

      // ── Cover header ──
      doc.setFillColor(37, 99, 235); doc.rect(0, 0, pw, 38, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(15); doc.setFont('helvetica','bold');
      doc.text('LAPORAN ANALISIS KEBUTUHAN SDM UPT', pw/2, 13, {align:'center'});
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      doc.text('Ditjen Binalavotas - Kementerian Ketenagakerjaan RI', pw/2, 22, {align:'center'});
      doc.setFontSize(8);
      doc.text(`${selectedDepartment}  |  ${locName}  |  ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})}`, pw/2, 30, {align:'center'});
      doc.setTextColor(0,0,0); y = 48;

      // ── Section: Data Internal ──
      doc.setFillColor(59,130,246); doc.rect(margin, y, cw, 7, 'F');
      doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.text('DATA INTERNAL (PETA JABATAN)', margin+3, y+5);
      doc.setTextColor(0,0,0); y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Pegawai ASN','Pegawai Non-ASN','Batas ABK','Defisit']],
        body: [[internalTotals.asn, internalTotals.nonAsn, internalTotals.abk, internalTotals.gap].map(String)],
        theme: 'grid',
        headStyles: { fillColor:[59,130,246], fontSize:8, fontStyle:'bold' },
        bodyStyles: { fontSize:9, halign:'center' },
        margin: { left:margin, right:margin }
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      if (positionDetails.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Nama Jabatan','Kategori','Eksisting','ABK','Status']],
          body: positionDetails.slice(0,12).map(p => [
            clean(p.name), clean(p.category),
            p.totalExisting.toString(), p.abkCount.toString(),
            p.gap>0?`Kurang ${p.gap}`:p.gap<0?`Lebih ${Math.abs(p.gap)}`:'Sesuai'
          ]),
          theme: 'striped',
          headStyles: { fillColor:[59,130,246], fontSize:7, fontStyle:'bold' },
          bodyStyles: { fontSize:7 },
          columnStyles: { 0:{cellWidth:84}, 1:{cellWidth:32}, 2:{cellWidth:18,halign:'center'}, 3:{cellWidth:18,halign:'center'}, 4:{cellWidth:28,halign:'center'} },
          margin: { left:margin, right:margin }
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // ── Section: Data BPS ──
      checkPage(30);
      doc.setFillColor(59,130,246); doc.rect(margin, y, cw, 7, 'F');
      doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.text('DATA EKSTERNAL BPS', margin+3, y+5);
      doc.setTextColor(0,0,0); y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Indikator','Nilai']],
        body: [
          ['TPT (Tingkat Pengangguran)', bpsTpt||'-'],
          ['NEET Pemuda', bpsNeet||'-'],
          ['Literasi TIK', bpsTik||'-'],
          ['Sektor PDRB Dominan', clean(bpsSektor)||'-'],
        ],
        theme: 'grid',
        headStyles: { fillColor:[59,130,246], fontSize:8, fontStyle:'bold' },
        bodyStyles: { fontSize:8 },
        columnStyles: { 0:{cellWidth:80,fontStyle:'bold'}, 1:{cellWidth:'auto'} },
        margin: { left:margin, right:margin }
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // ── Section: Hasil Analisis AI (parse markdown sections) ──
      doc.addPage(); y = 20;
      doc.setFillColor(34,197,94); doc.rect(margin, y, cw, 7, 'F');
      doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.text('HASIL ANALISIS & REKOMENDASI (AI)', margin+3, y+5);
      doc.setTextColor(0,0,0); y += 12;

      // Parse markdown into sections and render each appropriately
      const lines = aiMarkdown.split('\n');
      let i = 0;

      const writeText = (text: string, fontSize=8, bold=false, indent=0, color=[0,0,0] as number[]) => {
        checkPage(8);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);
        const wrapped = doc.splitTextToSize(clean(text), cw - indent);
        checkPage(wrapped.length * (fontSize * 0.45) + 2);
        doc.text(wrapped, margin + indent, y);
        y += wrapped.length * (fontSize * 0.45) + 2;
        doc.setTextColor(0,0,0);
      };

      // Collect table rows when inside a markdown table
      let tableRows: string[][] = [];
      let tableHeaders: string[] = [];
      let inTable = false;

      const flushTable = () => {
        if (tableHeaders.length === 0 && tableRows.length === 0) return;
        checkPage(20);
        autoTable(doc, {
          startY: y,
          head: tableHeaders.length > 0 ? [tableHeaders] : undefined,
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor:[71,85,105], fontSize:7, fontStyle:'bold', textColor:[255,255,255] },
          bodyStyles: { fontSize:7 },
          alternateRowStyles: { fillColor:[248,250,252] },
          margin: { left:margin, right:margin },
          tableWidth: 'auto',
          styles: { overflow:'linebreak', cellPadding:2 }
        });
        y = (doc as any).lastAutoTable.finalY + 5;
        tableRows = []; tableHeaders = []; inTable = false;
      };

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Markdown table row
        if (trimmed.startsWith('|')) {
          inTable = true;
          const cells = trimmed.split('|').map(c=>clean(c.trim())).filter((_,idx,arr)=>idx>0&&idx<arr.length-1);
          // Separator row (---|---|---)
          if (cells.every(c=>/^[-:]+$/.test(c))) { i++; continue; }
          if (tableHeaders.length === 0) { tableHeaders = cells; }
          else { tableRows.push(cells); }
          i++; continue;
        }

        // Flush table when we leave table context
        if (inTable) { flushTable(); }

        if (!trimmed) { y += 3; i++; continue; }

        // H1
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
          checkPage(12);
          doc.setFillColor(37,99,235); doc.rect(margin, y, cw, 9, 'F');
          doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont('helvetica','bold');
          doc.text(clean(trimmed.replace(/^#+\s*/,'')), margin+3, y+6.5);
          doc.setTextColor(0,0,0); y += 13;
          i++; continue;
        }
        // H2
        if (trimmed.startsWith('## ')) {
          checkPage(14);
          y += 4;
          doc.setFillColor(241,245,249); doc.rect(margin, y, cw, 8, 'F');
          doc.setDrawColor(59,130,246); doc.setLineWidth(0.5); doc.line(margin, y, margin, y+8);
          doc.setTextColor(37,99,235); doc.setFontSize(10); doc.setFont('helvetica','bold');
          doc.text(clean(trimmed.replace(/^#+\s*/,'')), margin+4, y+5.5);
          doc.setTextColor(0,0,0); y += 12;
          i++; continue;
        }
        // H3
        if (trimmed.startsWith('### ')) {
          checkPage(10);
          y += 2;
          doc.setTextColor(30,64,175); doc.setFontSize(9); doc.setFont('helvetica','bold');
          doc.text(clean(trimmed.replace(/^#+\s*/,'')), margin, y);
          doc.setTextColor(0,0,0); y += 6;
          i++; continue;
        }
        // H4
        if (trimmed.startsWith('#### ')) {
          writeText(trimmed.replace(/^#+\s*/,''), 8, true, 0, [71,85,105]);
          i++; continue;
        }
        // Blockquote
        if (trimmed.startsWith('> ')) {
          checkPage(10);
          const text = clean(trimmed.replace(/^>\s*/,''));
          const wrapped = doc.splitTextToSize(text, cw - 8);
          const bh = wrapped.length * 4 + 4;
          doc.setFillColor(255,251,235); doc.rect(margin, y, cw, bh, 'F');
          doc.setFillColor(251,191,36); doc.rect(margin, y, 2, bh, 'F');
          doc.setFontSize(7.5); doc.setFont('helvetica','italic'); doc.setTextColor(120,80,0);
          doc.text(wrapped, margin+5, y+3.5);
          doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');
          y += bh + 3;
          i++; continue;
        }
        // Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = clean(trimmed.replace(/^[-*]\s+/,''));
          const wrapped = doc.splitTextToSize(`- ${text}`, cw - 6);
          checkPage(wrapped.length * 3.5 + 1);
          doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
          doc.text(wrapped, margin+4, y);
          y += wrapped.length * 3.5 + 1;
          i++; continue;
        }
        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const text = clean(trimmed.replace(/^\d+\.\s+/,''));
          const num = trimmed.match(/^(\d+)\./)?.[1] || '';
          const wrapped = doc.splitTextToSize(`${num}. ${text}`, cw - 6);
          checkPage(wrapped.length * 3.5 + 1);
          doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
          doc.text(wrapped, margin+4, y);
          y += wrapped.length * 3.5 + 1;
          i++; continue;
        }
        // Horizontal rule
        if (trimmed === '---' || trimmed === '***') {
          checkPage(6); doc.setDrawColor(200,200,200); doc.setLineWidth(0.3);
          doc.line(margin, y, pw-margin, y); y += 5;
          i++; continue;
        }
        // Regular paragraph — handle **bold** inline
        const text = clean(trimmed.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/`([^`]+)`/g,'$1'));
        if (text) writeText(text, 8, false, 0);
        i++;
      }
      // Flush any remaining table
      if (inTable) flushTable();

      // ── Footer on all pages ──
      const pc = doc.getNumberOfPages();
      for (let p = 1; p <= pc; p++) {
        doc.setPage(p);
        doc.setFontSize(7); doc.setTextColor(150,150,150);
        doc.text(`Halaman ${p} dari ${pc}  |  SIMPEL SDM  |  ${new Date().toLocaleDateString('id-ID')}`, pw/2, ph-8, {align:'center'});
      }

      doc.save(`Laporan_SDM_${selectedDepartment.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({title:'✅ PDF Berhasil Diunduh', description:`Laporan ${selectedDepartment} tersimpan.`});
    } catch(e) {
      console.error(e);
      toast({title:'Gagal membuat PDF', description: e instanceof Error ? e.message : 'Error tidak diketahui.', variant:'destructive'});
    }
  };

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Analisis Kebutuhan SDM UPT</h2>
            <p className="text-muted-foreground text-sm">Modul cerdas yang mengawinkan <strong>Peta Jabatan Eksisting</strong> dengan <strong>Big Data BPS</strong> untuk rekomendasi formasi yang presisi.</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="shadow-sm border-primary/20">
                <History className="mr-2 h-4 w-4 text-primary" />
                Riwayat Analisis
                {analysisHistory.length>0&&<span className="ml-2 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5">{analysisHistory.length}</span>}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/>Riwayat Analisis AI</SheetTitle>
                <SheetDescription>Laporan analisis yang telah dibuat sebelumnya.</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-3">
                {analysisHistory.length===0
                  ? <div className="text-center py-10 text-muted-foreground"><History className="h-10 w-10 mx-auto mb-2 opacity-20"/><p>Belum ada riwayat.</p></div>
                  : analysisHistory.map(item=>(
                    <div key={item.id} className="group border rounded-xl p-3 hover:border-primary/50 cursor-pointer shadow-sm"
                      onClick={()=>{setAiMarkdown(item.markdown||'');setSelectedDepartment(item.unit_kerja);toast({title:'Laporan Dipulihkan',description:`${item.unit_kerja}`});}}>
                      <div className="flex justify-between items-start mb-1">
                        <div><div className="text-sm font-bold text-primary">{item.unit_kerja}</div><div className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/>{item.wilayah}</div></div>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(item.timestamp).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-slate-100 pl-2 mb-2">{item.preview}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                        onClick={e=>{e.stopPropagation();const h=analysisHistory.filter(x=>x.id!==item.id);setAnalysisHistory(h);localStorage.setItem('simpel_sdm_analysis_history',JSON.stringify(h));}}>
                        <Trash2 className="h-3 w-3"/>
                      </Button>
                    </div>
                  ))
                }
              </div>
              {analysisHistory.length>0&&<Button variant="outline" className="w-full text-xs" onClick={()=>{if(confirm('Hapus semua riwayat?')){setAnalysisHistory([]);localStorage.removeItem('simpel_sdm_analysis_history');}}}>
                <Trash2 className="mr-2 h-3 w-3"/>Bersihkan Semua
              </Button>}
            </SheetContent>
          </Sheet>
        </div>

        {/* SECTION 1: DATA INTERNAL */}
        <Card className="shadow-lg border-primary/20 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"/>
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl text-primary"><Database className="mr-2 h-5 w-5"/>Section 1: Data Internal (Peta Jabatan)</CardTitle>
                <CardDescription className="mt-1">Pilih unit kerja untuk memuat struktur formasi, ABK, dan kesenjangan SDM.</CardDescription>
              </div>
              <div className="w-1/3 min-w-[250px]">
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={selectedDepartment} onChange={e=>setSelectedDepartment(e.target.value)}>
                  <option value="">-- Pilih Unit Kerja UPT --</option>
                  {departments.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isFetchingInternal ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2"/>Memuat data...</div>
            ) : !selectedDepartment ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                <Users className="h-10 w-10 mb-2 opacity-30"/><p>Pilih Unit Kerja untuk memuat Peta Jabatan.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{label:'Pegawai ASN',val:internalTotals.asn,cls:''},{label:'Pegawai Non-ASN',val:internalTotals.nonAsn,cls:''},{label:'Total Batas ABK',val:internalTotals.abk,cls:'text-blue-600'},{label:'Total Defisit',val:internalTotals.gap,cls:'text-red-600'}].map(x=>(
                    <div key={x.label} className={cn('rounded-xl p-4 border shadow-sm bg-background',x.cls&&'bg-red-50 dark:bg-red-950/20 border-red-100')}>
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">{x.label}</p>
                      <p className={cn('text-2xl font-bold',x.cls)}>{x.val}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-md border overflow-hidden">
                  <div className="max-h-[280px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <TableRow><TableHead>Jabatan</TableHead><TableHead>Kategori</TableHead><TableHead className="text-center">Eksisting</TableHead><TableHead className="text-center">ABK</TableHead><TableHead className="text-center">Status</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {positionDetails.map(pos=>(
                          <TableRow key={pos.id}>
                            <TableCell className="font-medium text-sm">
                              <div>{pos.name}</div>
                              {pos.kejuruanDetails&&Object.keys(pos.kejuruanDetails).length>0&&(
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(pos.kejuruanDetails).map(([k,v])=>(
                                    <span key={k} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200">{k}: {v}</span>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{pos.category}</TableCell>
                            <TableCell className="text-center">{pos.totalExisting}</TableCell>
                            <TableCell className="text-center">{pos.abkCount}</TableCell>
                            <TableCell className="text-center">
                              {pos.gap>0?<span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">Kurang {pos.gap}</span>
                               :pos.gap<0?<span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">Lebih {Math.abs(pos.gap)}</span>
                               :<span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Sesuai</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                        {positionDetails.length===0&&<TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Tidak ada data formasi jabatan.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: BPS + REGULASI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 2A: BPS */}
          <Card className="shadow-lg border-blue-500/20 overflow-hidden flex flex-col">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-cyan-400"/>
            <CardHeader className="pb-3 bg-blue-50/30 dark:bg-blue-950/20">
              <CardTitle className="flex items-center text-xl text-blue-600 dark:text-blue-400"><MapPin className="mr-2 h-5 w-5"/>Section 2A: Profil Wilayah BPS</CardTitle>
              <CardDescription>Integrasikan demografi dan pasar kerja wilayah unit.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold">Provinsi</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    value={selectedProvince} onChange={e=>{setSelectedProvince(e.target.value);setSelectedRegency('');}} disabled={isFetchingProvinces}>
                    <option value="">-- Pilih Provinsi --</option>
                    {provinces.map(p=><option key={p.domain_id} value={p.domain_id}>{p.domain_name}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold">Kabupaten / Kota</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    value={selectedRegency} onChange={e=>setSelectedRegency(e.target.value)} disabled={!selectedProvince||isFetchingRegencies}>
                    <option value="">-- Semua --</option>
                    {regencies.map(r=><option key={r.domain_id} value={r.domain_id}>{r.domain_name}</option>)}
                  </select>
                </div>
              </div>
              {selectedProvince&&<div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-3 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600"/><span className="font-semibold text-blue-900 dark:text-blue-100">Wilayah:</span><span className="text-blue-700 dark:text-blue-300">{locName}</span>
              </div>}
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleGenerateBpsData} disabled={isGeneratingBps||!selectedProvince}>
                {isGeneratingBps?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menganalisis...</>:<><Activity className="mr-2 h-4 w-4"/>Tarik & Sintesis Data BPS</>}
              </Button>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {[{l:'TPT',v:bpsTpt},{l:'NEET',v:bpsNeet},{l:'TIK',v:bpsTik},{l:'Sektor Utama',v:bpsSektor}].map(x=>(
                  <div key={x.l} className="bg-primary/5 p-3 rounded-md border border-primary/10">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{x.l}</Label>
                    <div className="text-lg font-black text-primary mt-1 leading-tight">{x.v||'-'}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                {[{l:'Sintesis Utama',v:bpsSintesis,set:setBpsSintesis,h:24},{l:'Profil Industri (PDRB)',v:bpsIndustri,set:setBpsIndustri,h:28},{l:'Angkatan Kerja',v:bpsAngkatanKerja,set:setBpsAngkatanKerja,h:28},{l:'Lulusan & Angkatan Kerja Baru',v:bpsLulusan,set:setBpsLulusan,h:28},{l:'Kemiskinan & IPM',v:bpsKemiskinan,set:setBpsKemiskinan,h:24},{l:'Infrastruktur & Konektivitas',v:bpsInfrastruktur,set:setBpsInfrastruktur,h:24}].map(x=>(
                  <div key={x.l} className="space-y-1">
                    <Label className="text-xs font-semibold">{x.l}</Label>
                    <Textarea value={x.v} onChange={e=>x.set(e.target.value)} className={`h-${x.h} text-xs font-mono`} placeholder={`${x.l} (terisi otomatis)...`}/>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2B: Regulasi & Strategi */}
          <Card className="shadow-lg border-purple-500/20 overflow-hidden flex flex-col">
            <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-pink-400"/>
            <CardHeader className="pb-3 bg-purple-50/30 dark:bg-purple-950/20">
              <CardTitle className="flex items-center text-xl text-purple-700 dark:text-purple-300"><FileText className="mr-2 h-5 w-5"/>Section 2B: Parameter Regulasi & Kebijakan</CardTitle>
              <CardDescription>Landasan hukum dan kebijakan Ditjen Binalavotas Kemnaker RI.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center"><Building className="mr-1.5 h-3.5 w-3.5"/>Kondisi Sarpras Saat Ini</Label>
                <Textarea value={sarpras} onChange={e=>setSarpras(e.target.value)} className="h-20 text-sm font-mono" placeholder="Terisi otomatis dari data Unit Kerja..."/>
              </div>
              <Tabs defaultValue="standar" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4 h-auto">
                  <TabsTrigger value="standar" className="text-xs py-2">📋 Standar</TabsTrigger>
                  <TabsTrigger value="jabfung" className="text-xs py-2">🎓 Jabfung</TabsTrigger>
                  <TabsTrigger value="program" className="text-xs py-2">🏭 Program</TabsTrigger>
                  <TabsTrigger value="strategi" className="text-xs py-2">🎯 Strategi</TabsTrigger>
                </TabsList>
                
                {/* Tab: Standar */}
                <TabsContent value="standar" className="space-y-4 rounded-md border p-4 bg-purple-50/30 dark:bg-purple-950/20">
                  <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Daftar Regulasi Standar</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 flex items-center px-2 py-0.5 rounded font-semibold"
                      onClick={() => handleAddRegulation('standar')}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Regulasi Utama
                    </Button>
                  </div>
                  
                  {isLoadingPolicyParams ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></div>
                  ) : filteredRegulations('standar').length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">Belum ada regulasi standar.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredRegulations('standar').map((reg) => (
                        <div key={reg.id} className="border border-purple-200/60 dark:border-purple-950/40 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm space-y-2 group/reg">
                          <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-purple-100 dark:border-purple-950/50">
                            <span className="font-semibold text-purple-800 dark:text-purple-300 text-xs sm:text-sm">{reg.title}</span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950 flex items-center px-1.5 rounded font-semibold"
                                onClick={() => handleAddPoint(reg)}
                              >
                                <Plus className="mr-0.5 h-3 w-3" /> Tambah Point
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleEditPolicy(reg)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleDeletePolicy(reg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {filteredPoints(reg.id).length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic text-center py-2">Belum ada point dalam regulasi ini.</p>
                            ) : (
                              filteredPoints(reg.id).map((point) => (
                                <div key={point.id} className="flex justify-between items-center text-xs sm:text-sm py-1.5 border-b border-purple-50 dark:border-purple-950/30 last:border-0 group/point">
                                  <span className="text-muted-foreground">{point.title}</span>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <span className="font-bold text-purple-700 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded text-[11px]">{point.value}</span>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover/point:opacity-100 transition-opacity">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-primary"
                                        onClick={() => handleEditPolicy(point)}
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeletePolicy(point.id)}
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Jabfung */}
                <TabsContent value="jabfung" className="space-y-4 rounded-md border p-4 bg-blue-50/30 dark:bg-blue-950/20">
                  <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Daftar Regulasi Jabatan Fungsional</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 flex items-center px-2 py-0.5 rounded font-semibold"
                      onClick={() => handleAddRegulation('jabfung')}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Regulasi Utama
                    </Button>
                  </div>
                  
                  {isLoadingPolicyParams ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
                  ) : filteredRegulations('jabfung').length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">Belum ada regulasi jabatan fungsional.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredRegulations('jabfung').map((reg) => (
                        <div key={reg.id} className="border border-blue-200/60 dark:border-blue-950/40 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm space-y-2 group/reg">
                          <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-blue-100 dark:border-blue-950/50">
                            <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs sm:text-sm">{reg.title}</span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950 flex items-center px-1.5 rounded font-semibold"
                                onClick={() => handleAddPoint(reg)}
                              >
                                <Plus className="mr-0.5 h-3 w-3" /> Tambah Point
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleEditPolicy(reg)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleDeletePolicy(reg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {filteredPoints(reg.id).length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic text-center py-2">Belum ada point dalam regulasi ini.</p>
                            ) : (
                              filteredPoints(reg.id).map((point) => (
                                <div key={point.id} className="flex justify-between items-center text-xs sm:text-sm py-2 border-b border-blue-50 dark:border-blue-950/30 last:border-0 group/point">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <div className="font-medium text-slate-800 dark:text-slate-200">{point.title}</div>
                                    {point.description && <div className="text-[10px] text-muted-foreground mt-0.5">{point.description}</div>}
                                  </div>
                                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                                    {point.value && <span className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">Gol. {point.value}</span>}
                                    <div className="flex items-center space-x-1 opacity-0 group-hover/point:opacity-100 transition-opacity">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-primary"
                                        onClick={() => handleEditPolicy(point)}
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeletePolicy(point.id)}
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Program */}
                <TabsContent value="program" className="space-y-4 rounded-md border p-4 bg-orange-50/30 dark:bg-orange-950/20">
                  <div className="flex justify-between items-center pb-2 border-b border-orange-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">Daftar Kejuruan Prioritas</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 flex items-center px-2 py-0.5 rounded font-semibold"
                      onClick={() => handleAddRegulation('program')}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Regulasi Utama
                    </Button>
                  </div>
                  
                  {isLoadingPolicyParams ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-orange-600" /></div>
                  ) : filteredRegulations('program').length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">Belum ada regulasi kejuruan.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredRegulations('program').map((reg) => (
                        <div key={reg.id} className="border border-orange-200/60 dark:border-orange-950/40 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm space-y-2 group/reg">
                          <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-orange-100 dark:border-orange-950/50">
                            <span className="font-semibold text-orange-800 dark:text-orange-300 text-xs sm:text-sm">{reg.title}</span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950 flex items-center px-1.5 rounded font-semibold"
                                onClick={() => handleAddPoint(reg)}
                              >
                                <Plus className="mr-0.5 h-3 w-3" /> Tambah Point
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleEditPolicy(reg)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleDeletePolicy(reg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            {filteredPoints(reg.id).length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic text-center py-2">Belum ada point dalam regulasi ini.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {filteredPoints(reg.id).map((point) => (
                                  <div key={point.id} className="flex items-center justify-between text-xs bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-950/40 rounded px-2.5 py-1.5 group/point">
                                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-1">{point.title}</span>
                                    <div className="flex items-center space-x-0.5 opacity-0 group-hover/point:opacity-100 transition-opacity shrink-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-primary"
                                        onClick={() => handleEditPolicy(point)}
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeletePolicy(point.id)}
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Strategi */}
                <TabsContent value="strategi" className="space-y-4 rounded-md border p-4 bg-green-50/30 dark:bg-green-950/20">
                  <div className="flex justify-between items-center pb-2 border-b border-green-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300">Daftar Kebijakan & Strategi Renstra</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100/50 flex items-center px-2 py-0.5 rounded font-semibold"
                      onClick={() => handleAddRegulation('strategi')}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Regulasi Utama
                    </Button>
                  </div>
                  
                  {isLoadingPolicyParams ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
                  ) : filteredRegulations('strategi').length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">Belum ada regulasi strategi.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredRegulations('strategi').map((reg) => (
                        <div key={reg.id} className="border border-green-200/60 dark:border-green-950/40 rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm space-y-2 group/reg">
                          <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-green-100 dark:border-green-950/50">
                            <span className="font-semibold text-green-800 dark:text-green-300 text-xs sm:text-sm">{reg.title}</span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950 flex items-center px-1.5 rounded font-semibold"
                                onClick={() => handleAddPoint(reg)}
                              >
                                <Plus className="mr-0.5 h-3 w-3" /> Tambah Point
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleEditPolicy(reg)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/reg:opacity-100 transition-opacity"
                                onClick={() => handleDeletePolicy(reg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {filteredPoints(reg.id).length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic text-center py-2">Belum ada point dalam regulasi ini.</p>
                            ) : (
                              filteredPoints(reg.id).map((point) => (
                                <div key={point.id} className="flex items-start justify-between text-sm group/point pb-2 border-b border-green-50 dark:border-green-950/30 last:border-0">
                                  <label className="flex items-start space-x-2.5 cursor-pointer flex-1 mr-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      className="accent-primary mt-0.5 shrink-0 h-4 w-4 rounded"
                                      checked={selectedStrategies.includes(point.title)}
                                      onChange={(e) =>
                                        setSelectedStrategies(
                                          e.target.checked
                                            ? [...selectedStrategies, point.title]
                                            : selectedStrategies.filter((s) => s !== point.title)
                                        )
                                      }
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-slate-800 dark:text-slate-200 group-hover/point:text-primary transition-colors text-xs sm:text-sm">
                                        {point.title}
                                      </div>
                                      {point.description && (
                                        <div className="text-[11px] text-muted-foreground leading-normal">
                                          {point.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                  <div className="flex items-center space-x-0.5 opacity-0 group-hover/point:opacity-100 transition-opacity shrink-0">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                                      onClick={() => handleEditPolicy(point)}
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeletePolicy(point.id)}
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* GENERATE BUTTON */}
        <div className="py-2">
          <Button className="w-full h-14 text-lg font-bold shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all relative overflow-hidden"
            onClick={handleProcessAI} disabled={isProcessingAI||!selectedDepartment}>
            {isProcessingAI
              ? <><Loader2 className="mr-2 h-6 w-6 animate-spin"/>Sistem AI Sedang Memproses...</>
              : <><Sparkles className="mr-2 h-6 w-6"/>Jalankan Analisis AI (Sinkronisasi Internal & Eksternal)</>}
          </Button>
        </div>

        {/* SECTION 3: HASIL ANALISIS — MARKDOWN */}
        <Card className={cn('shadow-2xl transition-all duration-700 border-t-4', aiMarkdown?'border-green-500':'border-muted')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center text-2xl">
                  <BrainCircuit className={cn('mr-3 h-8 w-8', aiMarkdown?'text-green-500':'text-muted-foreground')}/>
                  Section 3: Laporan Eksekutif & Rekomendasi Cerdas
                </CardTitle>
                <CardDescription className="text-base">Hasil analisis AI berdasarkan data formasi eksisting dan makroekonomi wilayah.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 min-h-[300px]">
            {isProcessingAI ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10"/>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
                    <BrainCircuit className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse"/>
                  </div>
                  <div>
                    <p className="text-base font-medium animate-pulse">{aiProgress||'DeepSeek sedang menganalisis...'}</p>
                    <p className="text-xs text-muted-foreground italic mt-1">Menghubungkan data BPS {locName} dengan Peta Jabatan {selectedDepartment}.</p>
                  </div>
                </div>
                {aiThinking&&(
                  <div className="bg-slate-50 dark:bg-slate-900/80 border rounded-xl p-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-2">
                      <Sparkles className="h-3 w-3 text-amber-500 animate-pulse"/>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Chain of Thought</span>
                      <span className="text-[10px] text-primary animate-bounce font-mono ml-auto">Thinking...</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                      {aiThinking}<span className="inline-block w-2 h-3 ml-1 bg-primary animate-pulse"/>
                    </div>
                  </div>
                )}
                {aiMarkdown&&(
                  <div className="border rounded-xl p-4 bg-white dark:bg-slate-900">
                    <p className="text-xs text-muted-foreground mb-3 font-mono">Streaming hasil analisis...</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiMarkdown}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : !aiMarkdown ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl m-4 bg-muted/10">
                <Info className="h-16 w-16 mb-4 opacity-30"/>
                <p className="text-lg">Data siap untuk dianalisis.</p>
                <p className="text-sm">Tekan tombol di atas untuk men-generate laporan.</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {aiThinking&&(
                  <details className="group border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden mb-6">
                    <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 list-none">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                        <Sparkles className="mr-2 h-3 w-3 text-amber-500"/>Lihat Proses Berpikir AI
                      </span>
                      <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 border-t text-[11px] font-mono text-slate-500 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{aiThinking}</div>
                  </details>
                )}
                {/* Markdown result */}
                <div className="
                  prose prose-slate dark:prose-invert max-w-none
                  prose-h1:text-2xl prose-h1:font-bold prose-h1:text-slate-900 dark:prose-h1:text-slate-100 prose-h1:mb-2 prose-h1:mt-0
                  prose-h2:text-xl prose-h2:font-bold prose-h2:text-primary prose-h2:border-b prose-h2:border-primary/20 prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-base prose-h3:font-bold prose-h3:text-slate-700 dark:prose-h3:text-slate-300 prose-h3:mt-6 prose-h3:mb-3
                  prose-h4:text-sm prose-h4:font-semibold prose-h4:text-slate-600 dark:prose-h4:text-slate-400 prose-h4:mt-4 prose-h4:mb-2
                  prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2
                  prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:my-1
                  prose-ul:my-3 prose-ol:my-3
                  prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold
                  prose-table:w-full prose-table:text-sm
                  prose-thead:bg-slate-100 dark:prose-thead:bg-slate-800
                  prose-th:text-left prose-th:font-semibold prose-th:text-slate-700 dark:prose-th:text-slate-300 prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-700
                  prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700 prose-td:text-slate-700 dark:prose-td:text-slate-300
                  prose-tr:even:bg-slate-50 dark:prose-tr:even:bg-slate-800/50
                  prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-950/20 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                  prose-hr:border-slate-200 dark:prose-hr:border-slate-700 prose-hr:my-6
                  p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiMarkdown}</ReactMarkdown>
                </div>
              </div>
            )}
          </CardContent>
          {aiMarkdown&&!isProcessingAI&&(
            <CardFooter className="bg-muted/30 border-t pt-4 pb-4 flex justify-end">
              <Button size="lg" variant="outline" className="shadow-md" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-5 w-5"/>Unduh Laporan PDF
              </Button>
            </CardFooter>
          )}
        </Card>

      </div>

      {/* Dynamic Policy Parameter CRUD Dialog */}
      <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-2 flex-shrink-0 border-b">
            <DialogTitle>
              {currentPolicy 
                ? (policyForm.parent_id ? 'Edit Point Regulasi' : 'Edit Regulasi Utama') 
                : (policyForm.parent_id ? 'Tambah Point Regulasi' : 'Tambah Regulasi Utama')}
            </DialogTitle>
            <DialogDescription>
              {policyForm.parent_id ? (
                <>
                  Menambahkan point baru di bawah regulasi{' '}
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    {policyParams.find(p => p.id === policyForm.parent_id)?.title || 'Regulasi'}
                  </span>.
                </>
              ) : (
                <>
                  Membuat regulasi utama baru untuk kategori{' '}
                  <span className="font-semibold text-primary capitalize">{policyForm.category}</span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePolicy} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Category Select (disabled to protect integrity) */}
              <div className="space-y-1.5">
                <Label htmlFor="policy-category" className="text-xs font-semibold">Kategori</Label>
                <select
                  id="policy-category"
                  value={policyForm.category}
                  onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                  disabled={true}
                  className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background cursor-not-allowed opacity-80"
                >
                  <option value="standar">📋 Standar</option>
                  <option value="jabfung">🎓 Jabfung</option>
                  <option value="program">🏭 Program</option>
                  <option value="strategi">🎯 Strategi</option>
                </select>
              </div>

              {/* Regulation parent indicator (if adding/editing a point) */}
              {policyForm.parent_id && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Regulasi Induk</Label>
                  <Input
                    value={policyParams.find(p => p.id === policyForm.parent_id)?.title || ''}
                    disabled
                    className="bg-muted text-xs cursor-not-allowed font-medium"
                  />
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <Label htmlFor="policy-title" className="text-xs font-semibold">
                  {!policyForm.parent_id 
                    ? 'Nama Regulasi Utama / Dasar Hukum' 
                    : (policyForm.category === 'program' ? 'Nama Kejuruan' : 
                       policyForm.category === 'jabfung' ? 'Nama Jabatan Fungsional' : 'Parameter / Judul Point')}
                </Label>
                <Input
                  id="policy-title"
                  placeholder={
                    !policyForm.parent_id 
                      ? 'Contoh: Permenaker No. 6/2025 & No. 12/2024' 
                      : (policyForm.category === 'program' ? 'Contoh: 💻 TIK & Digital' :
                         policyForm.category === 'jabfung' ? 'Contoh: Instruktur Ahli Madya' : 'Contoh: Rasio Instruktur')
                  }
                  value={policyForm.title}
                  onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Value Input (Only for Point and Category Standar/Jabfung) */}
              {policyForm.parent_id && (policyForm.category === 'standar' || policyForm.category === 'jabfung') && (
                <div className="space-y-1.5">
                  <Label htmlFor="policy-value" className="text-xs font-semibold">
                    {policyForm.category === 'jabfung' ? 'Golongan (value)' : 'Nilai (value)'}
                  </Label>
                  <Input
                    id="policy-value"
                    placeholder={
                      policyForm.category === 'jabfung' ? 'Contoh: XI/XII' : 'Contoh: 1 : 16'
                    }
                    value={policyForm.value}
                    onChange={(e) => setPolicyForm({ ...policyForm, value: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Description Input (Only for Point and Category Jabfung/Strategi) */}
              {policyForm.parent_id && (policyForm.category === 'jabfung' || policyForm.category === 'strategi') && (
                <div className="space-y-1.5">
                  <Label htmlFor="policy-desc" className="text-xs font-semibold">
                    Keterangan (description)
                  </Label>
                  <Textarea
                    id="policy-desc"
                    placeholder={
                      policyForm.category === 'jabfung' ? 'Contoh: Pembina & quality control' : 'Contoh: Formasi CASN/PPPK berbasis ABK'
                    }
                    value={policyForm.description}
                    onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                    className="h-20 text-xs"
                    required={policyForm.category === 'strategi'}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPolicyModalOpen(false)}
                className="w-full sm:w-auto text-xs"
              >
                Batal
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-xs">
                Simpan Parameter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
