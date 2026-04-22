# Complete MIME Types Reference

## 📋 All MIME Types by Category

### 🖼️ Image MIME Types

```
image/jpeg
image/png
image/gif
image/webp
image/svg+xml
image/bmp
image/tiff
image/tiff-fx
image/heic
image/heif
image/avif
image/jp2
image/jpx
image/jpm
image/x-icon
image/vnd.microsoft.icon
```

### 📄 Document MIME Types

```
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
application/vnd.ms-powerpoint
application/vnd.openxmlformats-officedocument.presentationml.presentation
application/rtf
application/vnd.oasis.opendocument.text
application/vnd.oasis.opendocument.spreadsheet
application/vnd.oasis.opendocument.presentation
text/plain
text/html
text/css
text/csv
application/json
application/xml
application/xhtml+xml
```

### 🎵 Audio MIME Types

```
audio/mpeg
audio/mp3
audio/wav
audio/wave
audio/vnd.wave
audio/ogg
audio/webm
audio/aac
audio/flac
audio/x-m4a
audio/mp4
audio/midi
audio/x-midi
audio/x-ms-wma
audio/aiff
audio/x-aiff
```

### 🎥 Video MIME Types

```
video/mp4
video/mpeg
video/webm
video/ogg
video/quicktime
video/x-msvideo
video/x-ms-wmv
video/x-flv
video/x-matroska
video/3gpp
video/3gpp2
video/avi
video/x-m4v
```

### 📦 Archive MIME Types

```
application/zip
application/x-zip-compressed
application/x-rar-compressed
application/x-7z-compressed
application/x-tar
application/gzip
application/x-gzip
application/x-bzip2
application/x-bzip
application/x-xz
application/vnd.rar
```

---

## ✅ Recommended for Supabase Storage Buckets

### 🆔 ID Cards Bucket

**Minimal (Recommended):**
```
image/jpeg,image/png,application/pdf
```

**Extended (More formats):**
```
image/jpeg,image/png,image/gif,image/webp,image/bmp,application/pdf
```

**All Image + Document Types:**
```
image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/heic,image/heif,image/avif,image/jp2,image/jpx,image/jpm,image/x-icon,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
```

---

### 🏥 Medical Reports Bucket

**Minimal (Recommended):**
```
image/jpeg,image/png,application/pdf
```

**Extended (More formats):**
```
image/jpeg,image/png,image/gif,image/webp,image/tiff,image/bmp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**All Medical Document Types:**
```
image/jpeg,image/png,image/gif,image/webp,image/tiff,image/bmp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/plain,application/vnd.oasis.opendocument.text
```

---

### ✍️ Signatures Bucket

**Minimal (Recommended):**
```
image/jpeg,image/png
```

**Extended (More formats):**
```
image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml
```

**All Signature Types:**
```
image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff,image/x-icon
```

---

## 🎯 Quick Copy-Paste Values

### For ID Cards (5MB limit):
```
image/jpeg,image/png,image/gif,image/webp,image/bmp,application/pdf
```

### For Medical Reports (5MB limit):
```
image/jpeg,image/png,image/gif,image/webp,image/tiff,image/bmp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### For Signatures (2MB limit):
```
image/jpeg,image/png,image/gif,image/webp,image/svg+xml
```

---

## 📊 Complete List by Wildcard

### All Images:
```
image/*
```

### All Audio:
```
audio/*
```

### All Video:
```
video/*
```

### All Text:
```
text/*
```

### All Applications:
```
application/*
```

---

## ⚠️ Important Notes

1. **Supabase supports wildcards:**
   - `image/*` - All image types
   - `audio/*` - All audio types
   - `video/*` - All video types

2. **Comma-separated, no spaces:**
   ```
   ✅ Correct: image/jpeg,image/png,application/pdf
   ❌ Wrong: image/jpeg, image/png, application/pdf
   ```

3. **Case-sensitive:**
   ```
   ✅ Use lowercase: image/jpeg
   ❌ Don't use: image/JPEG
   ```

4. **Maximum MIME types per bucket:**
   - No hard limit, but keep it reasonable
   - 10-20 types is typical

5. **File size limits:**
   - ID cards: 5MB recommended
   - Medical reports: 5MB recommended
   - Signatures: 2MB recommended
   - Project maximum: 50MB

---

## 🔍 Common MIME Type Issues

### Problem: Upload fails
**Solution:** Check if file type is in allowed MIME types list

### Problem: "Invalid MIME type" error
**Solution:** Verify the exact MIME type string (no typos, lowercase)

### Problem: PDF won't upload
**Solution:** Make sure `application/pdf` is in the list

### Problem: Word documents fail
**Solution:** Add both old and new formats:
```
application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

---

## 📚 References

- [IANA Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml)
- [MDN Web Docs - MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)

---

**Last Updated:** 2026-02-18
