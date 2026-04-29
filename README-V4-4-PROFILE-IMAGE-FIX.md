# V4.4 profile image URL fix

The upload was working, but the frontend rendered:

```text
/uploads/profiles/...
```

against the frontend domain:

```text
https://shuleai.live/uploads/profiles/...
```

That produced 404.

This patch adds:

```js
resolveAssetUrl('/uploads/profiles/file.jpeg')
```

which returns:

```text
https://shuleaibackend-32h1.onrender.com/uploads/profiles/file.jpeg
```

It patches profile/admin/teacher avatar displays and upload previews.