# 🔒 Security Headers Implementation Guide

## Overview
Security headers telah ditambahkan untuk meningkatkan keamanan aplikasi SIMPEL.

## Headers yang Diterapkan

### 1. X-Content-Type-Options: nosniff
**Purpose:** Mencegah browser dari MIME type sniffing
**Protection:** Melindungi dari XSS attacks via MIME confusion

### 2. X-Frame-Options: DENY
**Purpose:** Mencegah aplikasi dimuat dalam iframe
**Protection:** Melindungi dari clickjacking attacks

### 3. X-XSS-Protection: 1; mode=block
**Purpose:** Mengaktifkan XSS filter di browser lama
**Protection:** Melindungi dari reflected XSS attacks

### 4. Referrer-Policy: strict-origin-when-cross-origin
**Purpose:** Mengontrol informasi referrer yang dikirim
**Protection:** Melindungi privacy user dan mencegah information leakage

### 5. Permissions-Policy
**Purpose:** Mengontrol fitur browser yang bisa diakses
**Protection:** Membatasi akses ke camera, microphone, geolocation, dll

## Implementation

Headers diterapkan melalui `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

## Verification

Setelah deployment, verifikasi headers dengan:

### Method 1: Browser DevTools
1. Buka aplikasi di browser
2. Buka DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click pada request utama
6. Check Response Headers

### Method 2: curl
```bash
curl -I https://your-app-url.vercel.app
```

### Method 3: Online Tools
- https://securityheaders.com/
- https://observatory.mozilla.org/

## Expected Results

Anda harus melihat headers berikut di response:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Additional Security Recommendations

### 1. Content Security Policy (CSP)
**Status:** ⚠️ Not Implemented Yet
**Recommendation:** Implement CSP untuk additional XSS protection

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://mauyygrbdopmpdpnwzra.supabase.co"
}
```

**Note:** CSP perlu testing ekstensif karena bisa break aplikasi jika tidak dikonfigurasi dengan benar.

### 2. Strict-Transport-Security (HSTS)
**Status:** ✅ Automatically handled by Vercel
**Info:** Vercel automatically adds HSTS headers untuk semua custom domains

### 3. Rate Limiting
**Status:** ⚠️ Not Implemented
**Recommendation:** Implement rate limiting di Supabase Edge Functions

## Testing

### Test 1: X-Frame-Options
Try to load your app in an iframe - should be blocked:

```html
<iframe src="https://your-app-url.vercel.app"></iframe>
```

Expected: Browser blocks the iframe

### Test 2: Security Headers Scan
Run security scan:
```bash
# Using securityheaders.com
curl -X POST https://securityheaders.com/api/v1/scan \
  -d "url=https://your-app-url.vercel.app"
```

## Troubleshooting

### Issue: Headers not showing
**Solution:** 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check vercel.json is committed
4. Redeploy application

### Issue: CSP blocking resources
**Solution:**
1. Check browser console for CSP violations
2. Add allowed sources to CSP policy
3. Test incrementally

## Maintenance

### Regular Tasks:
1. **Monthly:** Review security headers best practices
2. **Quarterly:** Run security scan
3. **Yearly:** Update headers based on new threats

### Updates:
- Monitor OWASP recommendations
- Follow Vercel security updates
- Review Mozilla Observatory suggestions

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Vercel Security Documentation](https://vercel.com/docs/concepts/edge-network/headers)
- [Security Headers](https://securityheaders.com/)

---

**Last Updated:** 2 April 2026  
**Next Review:** 2 Mei 2026
