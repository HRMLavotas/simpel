-- =============================================
-- Update additional_position (Jabatan Tambahan) berdasarkan data Excel
-- "Pejabat Lavotas 8 April 2026.xlsx"
-- Pencocokan menggunakan NIP
-- Kolom "v" di Excel menandakan pegawai memiliki jabatan tambahan
-- =============================================

-- Setditjen Binalavotas
UPDATE public.employees SET additional_position = 'Kepala Subbagian Rumah Tangga dan Perlengkapan' WHERE nip = '198112272014031002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Ketua Tim Kerja Penyusunan Rencana, Program, Evaluasi, dan Pelaporan' WHERE nip = '197910072007121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja Penyusunan Rencana, Program, dan Anggaran' WHERE nip = '198702242019021002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengelolaan data dan informasi' WHERE nip = '199001092019021003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja Kepatuhan Internal dan Manajemen Risiko' WHERE nip = '198304192007122001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja Hubungan Masyarakat dan Publikasi' WHERE nip = '198708082014031002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja Pemantauan, Evaluasi, dan Pelaporan' WHERE nip = '199406132020121015' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Ketua Tim Kerja Pengelolaan Keuangan' WHERE nip = '197511242005012002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja sistem akuntansi dan pelaporan keuangan' WHERE nip = '197510252003122001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja perbendaharaan dan tata usaha keuangan' WHERE nip = '198201312009121003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja pelaksanaan anggaran' WHERE nip = '198007112009011004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Ketua Tim Kerja Pengelolaan Sumber Daya Manusia Aparatur, Organisasi, Tata Laksana, dan Reformasi Birokrasi' WHERE nip = '198212222007011001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengelolaan sumber daya manusia aparatur' WHERE nip = '198809042012122001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pembinaan organisasi, tata laksana, dan reformasi birokrasi' WHERE nip = '198601162009122004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Ketua Tim Kerja Penyusunan Peraturan Perundang-Undangan dan Kerja Sama' WHERE nip = '198603092009122003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja penyusunan peraturan perundang-undangan' WHERE nip = '198510022009012004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja fasilitasi pengembangan kerja sama' WHERE nip = '198707312011012003' AND (additional_position IS NULL OR additional_position = '');

-- Dit. Bina Stankomproglat
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja pengembangan standardisasi kompetensi' WHERE nip = '197806132009121002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja pengembangan kualifikasi nasional' WHERE nip = '198408022007121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja pengembangan program pelatihan vokasi' WHERE nip = '199304112018011001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan materi pelatihan vokasi' WHERE nip = '198205052011011011' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja pengembangan metode pelatihan vokasi' WHERE nip = '198809292009122001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan sistem informasi pelatihan vokasi' WHERE nip = '198407012011011009' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja harmonisasi standar kompetensi dan kualifikasi nasional' WHERE nip = '198303082007121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pembinaan talenta' WHERE nip = '198411162007122001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja bidang pengembangan talenta' WHERE nip = '198102252014031001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja pengembangan prestasi regional' WHERE nip = '199401072018012001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan prestasi nasional' WHERE nip = '197605232006041012' AND (additional_position IS NULL OR additional_position = '');

-- Dit. Bina Intala
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja kebijakan pembinaan jabatan fungsional instruktur' WHERE nip = '198307122009011009' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pelaksanaan pembinaan jabatan fungsional instruktur' WHERE nip = '198407102009012006' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja peningkatan kompetensi profesi instruktur swasta' WHERE nip = '198007182009121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja bidang pembinaan dan pengembangan jejaring profesi instruktur swasta' WHERE nip = '198604262011012015' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan kompetensi dan jejaring tenaga pelatihan pemerintah' WHERE nip = '198012162009012004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan kompetensi dan jejaring tenaga pelatihan swasta' WHERE nip = '199109202014031002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan sistem dan informasi instruktur dan tenaga pelatihan' WHERE nip = '1986100820121210001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengelolaan data dan informasi instruktur dan tenaga pelatihan' WHERE nip = '198710052009122001' AND (additional_position IS NULL OR additional_position = '');

-- Dit. Bina Lemlatvok
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja perizinan lembaga pelatihan vokasi dan produktivitas' WHERE nip = '198212302009011007' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja akreditasi lembaga pelatihan vokasi dan produktivitas' WHERE nip = '197601292007121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan standar mutu lembaga pelatihan vokasi dan produktivitas' WHERE nip = '197601022011011003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja penjaminan mutu lembaga pelatihan vokasi dan produktivitas' WHERE nip = '198206282009121002' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pembinaan sarana lembaga pelatihan vokasi dan produktivitas' WHERE nip = '198110282011011010' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pembinaan prasarana lembaga pelatihan vokasi dan produktivitas' WHERE nip = '197404122005011001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan kemitraan lembaga pelatihan vokasi dan produktivitas' WHERE nip = '198908102012121003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan pendanaan lembaga pelatihan vokasi dan produktivitas' WHERE nip = '197609012005011002' AND (additional_position IS NULL OR additional_position = '');

-- Dit. Bina Lavogan
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja penyelenggaraan pelatihan vokasi' WHERE nip = '198401312012122001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja evaluasi penyelenggaraan pelatihan vokasi' WHERE nip = '199111132015031003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja fasilitasi dan pelayanan penyelenggara pemagangan dalam negeri' WHERE nip = '198605122009122004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pembinaan dan koordinasi pemagangan dalam negeri antar lembaga' WHERE nip = '198108072005011001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja penyelenggaraan pemagangan luar negeri' WHERE nip = '198201042009012007' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja perizinan dan advokasi penyelenggaraan pemagangan luar negeri' WHERE nip = '198909252014031003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja promosi pelatihan vokasi dan pemagangan' WHERE nip = '198607132012121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja kerja sama pelatihan vokasi dan pemagangan' WHERE nip = '198901312012121001' AND (additional_position IS NULL OR additional_position = '');

-- Dit. Bina Produktivitas
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengukuran peningkatan produktivitas sektor industri' WHERE nip = '198008192009121003' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengukuran peningkatan produktivitas sektor publik' WHERE nip = '198312212012121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja inovasi sistem dan metode peningkatan produktivitas' WHERE nip = '198301252009011004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan penerapan sistem dan metode peningkatan produktivitas' WHERE nip = '197712272009011004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pembinaan dan pengembangan kelembagaan peningkatan produktivitas' WHERE nip = '198409092009011004' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Pelaksana Wakil Ketua Tim Kerja promosi peningkatan produktivitas' WHERE nip = '198303262011011008' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja pengembangan kemitraan peningkatan produktivitas' WHERE nip = '198503142012121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja bimbingan dan konsultansi peningkatan produktivitas' WHERE nip = '197808252012121001' AND (additional_position IS NULL OR additional_position = '');
UPDATE public.employees SET additional_position = 'Wakil Ketua Tim Kerja penyelenggaraan pelatihan peningkatan produktivitas' WHERE nip = '197910012009011008' AND (additional_position IS NULL OR additional_position = '');

-- =============================================
-- Update mobile_phone (No HP) berdasarkan data Excel
-- Pencocokan menggunakan NIP
-- =============================================

-- Setditjen Binalavotas
UPDATE public.employees SET mobile_phone = '081806760899' WHERE nip = '197212051998031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082160009882' WHERE nip = '198205022005012002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08111093860' WHERE nip = '197902022011011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08128338668' WHERE nip = '198112272014031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082114285002' WHERE nip = '197910072007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081245437877' WHERE nip = '198702242019021002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085238546460' WHERE nip = '199001092019021003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081326232788' WHERE nip = '198304192007122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0818481006' WHERE nip = '198708082014031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082285033143' WHERE nip = '199406132020121015' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081296044652' WHERE nip = '197511242005012002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085691545981' WHERE nip = '197510252003122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081375386636' WHERE nip = '198201312009121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082124054455' WHERE nip = '198007112009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081289699039' WHERE nip = '198212222007011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08128098000' WHERE nip = '198809042012122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081385183850' WHERE nip = '198601162009122004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085780751749' WHERE nip = '198603092009122003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08121569112' WHERE nip = '198510022009012004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081299170371' WHERE nip = '198707312011012003' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Dit. Bina Stankomproglat
UPDATE public.employees SET mobile_phone = '0811915334' WHERE nip = '197407222001121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085234778810' WHERE nip = '198810212014031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0818748213' WHERE nip = '197503222006041001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081284547773' WHERE nip = '197806132009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081314526184' WHERE nip = '198408022007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081261886297' WHERE nip = '197705172009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081328550538' WHERE nip = '199304112018011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081389299022' WHERE nip = '198205052011011011' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0811961948' WHERE nip = '197412082003121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082110653653' WHERE nip = '198809292009122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081291201876' WHERE nip = '198407012011011009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081387751412' WHERE nip = '196911171995032001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08129501300' WHERE nip = '198303082007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08114440835' WHERE nip = '198411162007122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081314542221' WHERE nip = '197706012003121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081387212446' WHERE nip = '198102252014031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081298885810' WHERE nip = '199401072018012001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085264880990' WHERE nip = '197605232006041012' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Dit. Bina Intala
UPDATE public.employees SET mobile_phone = '081310369278' WHERE nip = '197107191992011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081323334849' WHERE nip = '198612202009121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085715091339' WHERE nip = '198007282005011002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '089677722695' WHERE nip = '198307122009011009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081342417343' WHERE nip = '198407102009012006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081385064900' WHERE nip = '197511152006041002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085782121827' WHERE nip = '198007182009121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081310308388' WHERE nip = '198604262011012015' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081320408411' WHERE nip = '198012162009012004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081328298862' WHERE nip = '199109202014031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '087781795165' WHERE nip = '197906232006042001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085888484844' WHERE nip = '1986100820121210001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081287272255' WHERE nip = '198710052009122001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Dit. Bina Lemlatvok
UPDATE public.employees SET mobile_phone = '08128110251' WHERE nip = '197304222005011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085296156789' WHERE nip = '198507072015031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081212908038' WHERE nip = '197104221998031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082225068214' WHERE nip = '198212302009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082119760808' WHERE nip = '197601292007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0811929299' WHERE nip = '197703052003122003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082298096168' WHERE nip = '197601022011011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081314434347' WHERE nip = '198206282009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08128095239' WHERE nip = '198001102005011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081319485050' WHERE nip = '198110282011011010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085250494949' WHERE nip = '197404122005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081227309696' WHERE nip = '198010172003122002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082135994430' WHERE nip = '198908102012121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082111766023' WHERE nip = '197609012005011002' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Dit. Bina Lavogan
UPDATE public.employees SET mobile_phone = '08170728208' WHERE nip = '197609052000121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08111672311' WHERE nip = '197504091999032002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08170023477' WHERE nip = '198701012009121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081291240087' WHERE nip = '198401312012122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081511504535' WHERE nip = '199111132015031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081389141914' WHERE nip = '197008301998031004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082123299516' WHERE nip = '198605122009122004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08170943077' WHERE nip = '198108072005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081382914002' WHERE nip = '197110311998031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081223751469' WHERE nip = '198201042009012007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081298177655' WHERE nip = '198909252014031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '088211572348' WHERE nip = '197011031998031004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081361132310' WHERE nip = '198607132012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08561539969' WHERE nip = '198901312012121001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Dit. Bina Produktivitas
UPDATE public.employees SET mobile_phone = '0811100748' WHERE nip = '197205082000031007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081219763438' WHERE nip = '197605082009122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08111731174' WHERE nip = '197401312003122002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081908270000' WHERE nip = '198008192009121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08170430340' WHERE nip = '198312212012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082114242855' WHERE nip = '197706062005012001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '087770891777' WHERE nip = '198301252009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08111339771' WHERE nip = '197712272009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08128535194' WHERE nip = '197903202003121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081288003009' WHERE nip = '198409092009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081284644321' WHERE nip = '198303262011011008' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081213395309' WHERE nip = '198503142012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082123260529' WHERE nip = '198002162012122002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082111150197' WHERE nip = '197808252012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08128314501' WHERE nip = '197910012009011008' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Set. BNSP
UPDATE public.employees SET mobile_phone = '08561050500' WHERE nip = '196907251997031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081318956745' WHERE nip = '197701172003121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0816266639' WHERE nip = '197601132006041003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081363009052' WHERE nip = '198003212006042004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081212541998' WHERE nip = '198511192009011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081328002439' WHERE nip = '198510162009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08195550115' WHERE nip = '198603072012122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081210056696' WHERE nip = '198110092011011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081289338888' WHERE nip = '197202132005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '087854154190' WHERE nip = '199606032019022001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081386377860' WHERE nip = '197702242003122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08119927366' WHERE nip = '197809222012122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0811883336' WHERE nip = '198212252015032001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081383544386' WHERE nip = '198204202006042004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081280379263' WHERE nip = '198306302011011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081386848485' WHERE nip = '198210052014032001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BBPVP Medan
UPDATE public.employees SET mobile_phone = '085255505265' WHERE nip = '198303122009011014' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0817205248' WHERE nip = '197506162005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082172356682' WHERE nip = '198209242009122004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081265858531' WHERE nip = '198502212011012017' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081370539597' WHERE nip = '197604132009011005' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081363073705' WHERE nip = '198505262015031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081361911162' WHERE nip = '198212132009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082210245318' WHERE nip = '198009182005012002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085282445660' WHERE nip = '198212302015031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085271485523' WHERE nip = '198604072011011010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081262902233' WHERE nip = '196806261997032001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081373077232' WHERE nip = '198112212007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08116486866' WHERE nip = '198606082009011001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BBPVP Serang
UPDATE public.employees SET mobile_phone = '0811810647' WHERE nip = '197906292009011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085920792864' WHERE nip = '197911302002121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082124608929' WHERE nip = '198507282011011011' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081274570513' WHERE nip = '198906012015031004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081280289371' WHERE nip = '197207271998032001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082123388883' WHERE nip = '198303132011011014' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085212989694' WHERE nip = '198311102011011010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081314549986' WHERE nip = '196912281998031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081380179180' WHERE nip = '197204052005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081927030545' WHERE nip = '197202241998031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '087720622404' WHERE nip = '198606092012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '087808893836' WHERE nip = '197806192001121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082218292628' WHERE nip = '198605292009011002' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BBPVP Bekasi
UPDATE public.employees SET mobile_phone = '081267514389' WHERE nip = '197601312002121009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085252031008' WHERE nip = '198506262009121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08118621308' WHERE nip = '197902242006041004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081317709945' WHERE nip = '198811262009122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081380656200' WHERE nip = '197903312003121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08111967890' WHERE nip = '198110082009011010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081261886297' WHERE nip = '197705292005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0811137599' WHERE nip = '197612132006041002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081931988887' WHERE nip = '198607072015031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081210201248' WHERE nip = '197603252007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082111272627' WHERE nip = '197510162003121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081318259797' WHERE nip = '197111172003122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081212801584' WHERE nip = '197208091994031003' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BBPVP Bandung
UPDATE public.employees SET mobile_phone = '082316198685' WHERE nip = '197512042005012009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081285186337' WHERE nip = '198711212009121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082119217755' WHERE nip = '198208102007012001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08156214199' WHERE nip = '197702262006041004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08562146747' WHERE nip = '198304052007121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081906311660' WHERE nip = '197610012003121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0817205715' WHERE nip = '198212262014032001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081222907709' WHERE nip = '198001022009011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081804565651' WHERE nip = '197911182009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081210145019' WHERE nip = '198201162009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082121484969' WHERE nip = '197205212005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081316966616' WHERE nip = '198007072009121005' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081325437240' WHERE nip = '198304292009012006' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BBPVP Semarang
UPDATE public.employees SET mobile_phone = '08158851981' WHERE nip = '198311222007011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085640653057' WHERE nip = '198605232009011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085328089217' WHERE nip = '198809022011011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081328120515' WHERE nip = '198304222009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085290306060' WHERE nip = '197902232003121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082135433623' WHERE nip = '198803192015031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085740212933' WHERE nip = '198905052015032009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081288238446' WHERE nip = '197709152006041004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081325654370' WHERE nip = '198105232006041001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085232140042' WHERE nip = '198205092006041005' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082136913774' WHERE nip = '197404202006042012' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085865149419' WHERE nip = '198208232014061003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085640651713' WHERE nip = '198512092012121002' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BBPVP Makassar
UPDATE public.employees SET mobile_phone = '081314168286' WHERE nip = '198601022009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085255417911' WHERE nip = '197703122009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085255312600' WHERE nip = '198509072005021001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081342964464' WHERE nip = '198711042015021001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081222230905' WHERE nip = '198105162009011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0811460925' WHERE nip = '197704042009011009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085398208877' WHERE nip = '197711042009012003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081316464481' WHERE nip = '198102242009121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08126712083' WHERE nip = '198009092006041003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081355075867' WHERE nip = '196603161998031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08112058080' WHERE nip = '197504172005011002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082225967685' WHERE nip = '198403302009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085396563717' WHERE nip = '199503242019021004' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Banda Aceh
UPDATE public.employees SET mobile_phone = '081362669991' WHERE nip = '198103302009011005' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085277455050' WHERE nip = '197211292001122003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08126970834' WHERE nip = '198406202009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08121895080' WHERE nip = '198209132009121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08126955899' WHERE nip = '198201222009011008' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Padang
UPDATE public.employees SET mobile_phone = '081314336003' WHERE nip = '198211142007011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085264861472' WHERE nip = '198001052009122001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082238312823' WHERE nip = '198807112014031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082172820092' WHERE nip = '197101171998031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085263362105' WHERE nip = '198205212009012004' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Surakarta
UPDATE public.employees SET mobile_phone = '082243773772' WHERE nip = '198611052015031004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081328771807' WHERE nip = '197911122009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08562957526' WHERE nip = '198311252009011009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081393195174' WHERE nip = '198207102006041001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08562573991' WHERE nip = '197703262006041003' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Samarinda
UPDATE public.employees SET mobile_phone = '081287789999' WHERE nip = '198005172003121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082153402591' WHERE nip = '197607062005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081350999586' WHERE nip = '198001272009122003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081347353965' WHERE nip = '197705282005011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081347196508' WHERE nip = '197207221998032001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Kendari
UPDATE public.employees SET mobile_phone = '085233525222' WHERE nip = '197707312003121007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085213597406' WHERE nip = '198802112019021002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081341570782' WHERE nip = '197901222010011015' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081342461419' WHERE nip = '198702092009032003' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Ternate
UPDATE public.employees SET mobile_phone = '081342619600' WHERE nip = '197410072009011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085299441488' WHERE nip = '198206122009011010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085256596969' WHERE nip = '197612052003121010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082210353529' WHERE nip = '198012202001121003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081355653333' WHERE nip = '198501172009121005' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Ambon
UPDATE public.employees SET mobile_phone = '081807847262' WHERE nip = '197408102005011002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082199555212' WHERE nip = '198309272011011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0811485791' WHERE nip = '198402202009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081248445617' WHERE nip = '198402172010011012' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082197588806' WHERE nip = '198312202010011015' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Sorong
UPDATE public.employees SET mobile_phone = '085244417594' WHERE nip = '196904071998031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081245368485' WHERE nip = '196909102001121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085244551133' WHERE nip = '197312262009011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081335867866' WHERE nip = '198208302011011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082131539015' WHERE nip = '197905012009011006' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Bandung Barat
UPDATE public.employees SET mobile_phone = '08156240964' WHERE nip = '197902102005011002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081221567293' WHERE nip = '197804092000032001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081321053601' WHERE nip = '197912302014031001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '087772777676' WHERE nip = '197701212009011009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08114864397' WHERE nip = '198906302012121001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Lombok Timur
UPDATE public.employees SET mobile_phone = '081295599891' WHERE nip = '198108262006041012' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0818187201' WHERE nip = '197101031994031002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081803662171' WHERE nip = '198303082015031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085239699373' WHERE nip = '197307082000032005' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081380695114' WHERE nip = '198903152018011001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Bantaeng
UPDATE public.employees SET mobile_phone = '085280466122' WHERE nip = '197204212007011027' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082191919120' WHERE nip = '197201282009011004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085340699666' WHERE nip = '197609022008041001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082393112228' WHERE nip = '198811032020121007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085298973065' WHERE nip = '197903092011112001' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Sidoarjo
UPDATE public.employees SET mobile_phone = '081553239183' WHERE nip = '198303172011011014' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081282006506' WHERE nip = '198605172011012010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082138414072' WHERE nip = '198304012012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085315099989' WHERE nip = '198605172011011016' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081282007919' WHERE nip = '198804152011012018' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Banyuwangi
UPDATE public.employees SET mobile_phone = '081573079600' WHERE nip = '197906232006041005' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085161610313' WHERE nip = '197708012009032002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08113033602' WHERE nip = '199112102018011003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082221007337' WHERE nip = '198703292012121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082333711265' WHERE nip = '199106132020121017' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Pangkep
UPDATE public.employees SET mobile_phone = '082336773976' WHERE nip = '197606242011011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085299441999' WHERE nip = '197905152009011007' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081329687559' WHERE nip = '198411282009011002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081355642991' WHERE nip = '199104072020121020' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08114403813' WHERE nip = '199206122020121017' AND (mobile_phone IS NULL OR mobile_phone = '');

-- BPVP Belitung
UPDATE public.employees SET mobile_phone = '081294000116' WHERE nip = '197403292007101002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081375527983' WHERE nip = '198609272009122004' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081327352438' WHERE nip = '199111242020121012' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081929203467' WHERE nip = '199706052020122023' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081269706558' WHERE nip = '197904172009011010' AND (mobile_phone IS NULL OR mobile_phone = '');

-- Satpel
UPDATE public.employees SET mobile_phone = '081365622552' WHERE nip = '198602142018011001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '08176704377' WHERE nip = '197809052003121001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081287913427' WHERE nip = '197709072009011008' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '0818942980' WHERE nip = '197102191998031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081241449606' WHERE nip = '198002182005011009' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '085299146077' WHERE nip = '197209052009021001' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082188858191' WHERE nip = '197910292010012013' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081266049274' WHERE nip = '197405062008011002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081377333291' WHERE nip = '197902032009011010' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082136410041' WHERE nip = '196907191996031003' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082195000500' WHERE nip = '198311102009121002' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '081248627107' WHERE nip = '197709092009011006' AND (mobile_phone IS NULL OR mobile_phone = '');
UPDATE public.employees SET mobile_phone = '082299462722' WHERE nip = '198311242011011009' AND (mobile_phone IS NULL OR mobile_phone = '');
