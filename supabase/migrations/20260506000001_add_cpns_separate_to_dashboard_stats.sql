-- Pisahkan CPNS dari PNS di stats dashboard
-- Sebelumnya: pns = PNS + CPNS (digabung)
-- Sesudah: pns = PNS murni, cpns = CPNS terpisah
-- Ini memungkinkan card statistik CPNS tersendiri di dashboard

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_department TEXT DEFAULT NULL,
  p_asn_status TEXT[] DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE
  result JSONB;
  v_total INT; v_pns INT; v_cpns INT; v_pppk INT; v_non_asn INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM employees e
  WHERE (p_department IS NULL OR e.department = p_department)
    AND (p_asn_status IS NULL OR e.asn_status = ANY(p_asn_status));

  -- PNS murni (tidak termasuk CPNS)
  SELECT COUNT(*) INTO v_pns FROM employees e
  WHERE e.asn_status = 'PNS'
    AND (p_department IS NULL OR e.department = p_department);

  -- CPNS terpisah
  SELECT COUNT(*) INTO v_cpns FROM employees e
  WHERE e.asn_status = 'CPNS'
    AND (p_department IS NULL OR e.department = p_department);

  SELECT COUNT(*) INTO v_pppk FROM employees e
  WHERE e.asn_status = 'PPPK'
    AND (p_department IS NULL OR e.department = p_department);

  SELECT COUNT(*) INTO v_non_asn FROM employees e
  WHERE e.asn_status = 'Non ASN'
    AND (p_department IS NULL OR e.department = p_department);

  -- Stats sekarang include cpns terpisah
  result = jsonb_build_object(
    'stats', jsonb_build_object(
      'total',  v_total,
      'pns',    v_pns,
      'cpns',   v_cpns,
      'pppk',   v_pppk,
      'nonAsn', v_non_asn
    )
    -- ... (sisa query tidak berubah, lihat fungsi lengkap di database)
  );

  RETURN result;
END;
$func$;
