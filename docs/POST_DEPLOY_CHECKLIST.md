# Post-deploy Checklist

Run this after the first Vercel deployment and after meaningful auth, database, storage, or routing
changes.

- Landing page loads.
- Email signup works.
- Email confirmation works if enabled.
- Email login works.
- Google login works if configured.
- Logout works.
- Session persistence works after refresh and browser restart.
- Manual item creation works.
- URL-based item creation works.
- Item editing works.
- Item deletion works.
- Collection create, read, update, and delete works.
- Category create, read, update, and delete works.
- Archive works.
- Restore works.
- Purchased/Achieved flow works.
- Image upload works.
- Remote image extraction works where supported by the source site.
- View at Store opens the original product URL.
- JSON export works.
- CSV export works.
- Mobile layout is usable.
- Back button behavior is sane across item, collection, and dashboard routes.
- Second-user RLS isolation test passes.

## Mandatory Second-user Security Test

User A:

- Create an item.
- Create a collection.
- Upload or import an image.
- Add price or purchase information.
- Log out.

User B:

- Sign in.
- Confirm User B sees none of User A's items, categories, collections, images, price history, or
  purchase information.
- Paste a copied User A item URL while logged in as User B.
- Confirm User B cannot read User A's private record.

Google OAuth does not replace this security test. RLS and private storage policies provide data
isolation.
