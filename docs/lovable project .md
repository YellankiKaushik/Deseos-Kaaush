Below is the implementation specification you can place in Lovable’s **Knowledge file** and use as the source of truth. Lovable supports full-stack applications, Supabase integration, Edge Functions, GitHub export, and external frontend hosting. Exporting through GitHub gives you control of the code for subsequent Codex work and Vercel deployment. ([Lovable Documentation](https://docs.lovable.dev/introduction/welcome?utm_source=chatgpt.com))

# **Personal Acquisition Dashboard**

## **Product Requirements and Technical Implementation Specification**

**Working name:** AspireList  
**Document version:** 1.0  
**Application type:** Responsive personal web application  
**Primary platform:** Lovable  
**Frontend deployment:** Vercel  
**Backend:** Supabase or Lovable Cloud backed by Supabase-compatible services  
**Post-export development:** GitHub \+ local development \+ OpenAI Codex

---

# **1\. Product definition**

AspireList is a permanent visual dashboard where a user saves products, experiences, services, and life-goal purchases from different websites.

The user pastes a webpage URL. The application retrieves as much structured information as possible from that page, presents the extracted information in an editable preview, and saves the item as a visual card.

The application is not merely a bookmark manager. It combines:

- A universal wishlist
- A personal vision board
- A purchase-priority system
- A savings and acquisition planner
- A purchased-goals archive
- A searchable private catalogue

The user should be able to return years later and continue adding, updating, purchasing, archiving, and reorganising items.

---

# **2\. Core product objective**

Create one application in which the user can:

1. Paste a product or webpage URL.
2. Automatically retrieve available product details.
3. Review and correct the extracted information.
4. Save the item permanently.
5. View every desired item in one visual dashboard.
6. Organise items into collections and categories.
7. Record why the item matters.
8. Prioritise and plan the purchase.
9. Track savings and purchase status.
10. Open the original webpage at any time.
11. Retain purchased items as completed achievements.

---

# **3\. Critical technical constraint**

The application must not promise perfect extraction from every website.

Websites differ substantially:

- Some expose structured product data.
- Some provide only Open Graph metadata.
- Some render prices and images using client-side JavaScript.
- Some block automated requests.
- Some require authentication, cookies, geographic location, or CAPTCHA.
- Some prohibit scraping in their terms.
- Some change their page structure frequently.

The application must therefore use a layered extraction system:

1. Structured JSON-LD product data
2. Open Graph metadata
3. Standard HTML metadata
4. Basic DOM heuristics
5. Domain-specific parsers for selected stores
6. Optional external browser-rendering or extraction provider
7. Manual entry and correction fallback

The manual fallback is mandatory. Extraction failure must never prevent a user from saving an item.

---

# **4\. Intended user model**

## **Version 1**

Build as a private, single-user-style application with full authentication support.

Although the initial user may be one person, all database tables must use `user_id` and Row Level Security so the architecture supports multiple accounts safely.

## **Authentication methods**

Initial authentication:

- Email and password
- Magic link, if easy to configure
- Password reset
- Sign out

Optional later authentication:

- Google OAuth
- Apple login

Users must never be able to view or modify another user’s saved items.

---

# **5\. Recommended technical stack**

## **Frontend**

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide icons
- TanStack Query for server-state management
- React Hook Form
- Zod validation

## **Backend**

Use Supabase through Lovable integration:

- PostgreSQL database
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions
- Row Level Security
- Database migrations
- Scheduled functions later for price refreshing

Supabase provides PostgreSQL, authentication, storage, and Edge Functions. Lovable can generate and deploy Supabase Edge Functions from natural-language requirements. ([Lovable Documentation](https://docs.lovable.dev/integrations/supabase?utm_source=chatgpt.com))

## **Deployment**

- GitHub as the source repository
- Vercel for frontend deployment
- Supabase for backend services
- Environment variables configured separately in development, preview, and production

Vercel supports Vite applications and environment-specific variables. ([Vercel](https://vercel.com/docs/frameworks/frontend/vite?utm_source=chatgpt.com))

---

# **6\. High-level system architecture**

Browser  
|  
|-- React application  
| |  
| |-- Authentication UI  
| |-- Dashboard  
| |-- Add-item workflow  
| |-- Item details  
| |-- Collections  
| |-- Settings  
|  
|-- Supabase client  
|  
|-- Auth  
|-- PostgreSQL  
|-- Storage  
|-- Row Level Security  
|  
|-- Edge Function: extract-product  
| |  
| |-- Validate submitted URL  
| |-- Block unsafe/internal addresses  
| |-- Fetch public webpage  
| |-- Parse JSON-LD  
| |-- Parse Open Graph tags  
| |-- Parse HTML metadata  
| |-- Apply store-specific rules  
| |-- Return normalised product data  
|  
|-- Edge Function: refresh-product  
|  
|-- Re-fetch saved source  
|-- Update current price  
|-- Record price history

---

# **7\. Primary user journeys**

## **7.1 First-time user**

1. User opens the landing page.
2. User selects “Create my dashboard.”
3. User creates an account.
4. User is redirected to an empty dashboard.
5. Empty state explains how to add the first item.
6. User pastes a URL.
7. Application extracts information.
8. User reviews the preview.
9. User saves the item.
10. The first card appears in the dashboard.

## **7.2 Add item from URL**

1. User clicks “Add item.”
2. User pastes a URL.
3. Client validates basic URL syntax.
4. Client calls the `extract-product` Edge Function.
5. Interface displays a loading state.
6. Backend validates the URL for security.
7. Backend fetches and parses the webpage.
8. Backend returns normalised fields and extraction confidence.
9. Application displays an editable preview.
10. User corrects missing or inaccurate fields.
11. User selects category, collection, priority, and status.
12. User adds optional personal notes.
13. Application saves the item.
14. User is redirected to the item detail page or dashboard.

## **7.3 Manual item entry**

Manual entry must be available immediately, not hidden only after an error.

The user can enter:

- Name
- Image
- Current price
- Currency
- Store
- URL
- Brand
- Description
- Category
- Collection
- Notes
- Priority
- Status

## **7.4 Update an item**

The user can:

- Edit any field
- Replace the image
- Change category
- Move between collections
- Change priority
- Update savings
- Mark as purchased
- Archive
- Delete
- Re-run extraction

## **7.5 Mark as purchased**

When the user marks an item as purchased:

- Set status to `purchased`
- Ask for purchase date
- Ask for actual purchase price
- Preserve original desired price
- Move the item into the Achievements/Purchased view
- Do not delete its history

---

# **8\. Application pages**

## **8.1 Public landing page**

Route:

/

Purpose:

- Explain the product
- Provide sign-up and sign-in actions
- Show a visual demonstration
- Avoid exposing private user content

Sections:

- Hero
- Three-step explanation
- Feature summary
- Privacy statement
- Sign-up CTA

Do not overbuild this page during the MVP.

---

## **8.2 Authentication pages**

Routes:

/auth/sign-in  
/auth/sign-up  
/auth/forgot-password  
/auth/reset-password

Requirements:

- Clear form validation
- Password visibility toggle
- Loading state
- Error messages
- Redirect authenticated users to `/dashboard`
- Redirect unauthenticated users away from private routes

---

## **8.3 Dashboard**

Route:

/dashboard

Main sections:

### **Header**

- Logo/application name
- Search input
- Add Item button
- User menu
- Mobile navigation control

### **Summary area**

Display:

- Total saved items
- Total estimated wishlist value
- Total purchased items
- High-priority item count

Currency totals must not blindly add different currencies. Either:

- Show totals grouped by currency, or
- Use a user-selected base currency with later exchange-rate conversion

For MVP, group totals by currency.

### **Filters**

- All items
- Category
- Collection
- Status
- Priority
- Store
- Price range
- Date added

### **Sorting**

- Newest
- Oldest
- Price: low to high
- Price: high to low
- Priority
- Target date
- Recently updated

### **Display modes**

- Responsive card grid
- Compact list view

### **Empty state**

Display when no items exist:

- Short explanation
- Add first item button
- Manual entry option

---

## **8.4 Add item page or modal**

Route:

/items/new

Recommended flow:

### **Step 1: URL input**

Fields:

- Product URL
- Fetch button
- Manual entry link

### **Step 2: Extraction progress**

Show understandable phases:

- Checking link
- Reading page information
- Preparing preview

Do not display fake progress percentages.

### **Step 3: Editable preview**

Fields:

- Product name
- Brand
- Main image
- Additional images
- Current price
- Original price
- Currency
- Rating
- Review count
- Store
- Description
- Availability
- Category
- Collection
- Priority
- Status
- Why I want this
- Personal notes
- Target purchase date
- Target budget
- Amount saved

Buttons:

- Save item
- Cancel
- Retry extraction
- Enter manually

---

## **8.5 Item details page**

Route:

/items/:itemId

Display:

- Large image gallery
- Product name
- Brand
- Current price
- Original price
- Discount
- Rating
- Store
- Availability
- Original-page button
- Personal motivation
- Notes
- Priority
- Status
- Category
- Collections
- Savings progress
- Target purchase date
- Date added
- Last extraction date
- Price history, when available

Actions:

- Edit
- Refresh details
- Mark purchased
- Archive
- Delete

External links must open safely using:

target="\_blank"  
rel="noopener noreferrer"

---

## **8.6 Collections page**

Routes:

/collections  
/collections/:collectionId

A collection contains:

- Name
- Description
- Cover image or icon
- Item count
- Optional target date
- Optional total budget

Examples:

- Technology
- Home
- Fashion
- Travel
- Dream Purchases
- This Year
- Health and Fitness

The user must be able to create, rename, reorder, and delete collections.

Deleting a collection must not delete its items. Remove collection associations instead.

---

## **8.7 Purchased items page**

Route:

/purchased

Display:

- Purchased items
- Purchase date
- Original target price
- Actual purchase price
- Difference between planned and actual price
- Optional reflection note

This page is an achievement archive.

---

## **8.8 Archived items page**

Route:

/archived

Archived items remain stored but are excluded from normal dashboard results unless explicitly included.

---

## **8.9 Settings page**

Route:

/settings

Sections:

- Profile
- Default currency
- Default dashboard view
- Theme
- Data export
- Account deletion

Optional later:

- Price refresh frequency
- Notification preferences
- Public/private profile settings

---

# **9\. Database design**

Use UUID primary keys.

Use `timestamptz` for timestamps.

Use PostgreSQL enums only when values are very stable. Otherwise use validated text fields or lookup tables. For Lovable simplicity, validated text fields with constraints are acceptable.

## **9.1 Profiles table**

create table public.profiles (  
id uuid primary key references auth.users(id) on delete cascade,  
display\_name text,  
avatar\_url text,  
default\_currency text not null default 'INR',  
default\_view text not null default 'grid',  
theme text not null default 'system',  
created\_at timestamptz not null default now(),  
updated\_at timestamptz not null default now()  
);

Constraints:

check (default\_view in ('grid', 'list'));  
check (theme in ('system', 'light', 'dark'));

---

## **9.2 Items table**

create table public.items (  
id uuid primary key default gen\_random\_uuid(),  
user\_id uuid not null references auth.users(id) on delete cascade,

source\_url text,  
canonical\_url text,  
source\_domain text,  
store\_name text,

title text not null,  
brand text,  
description text,

current\_price numeric(14,2),  
original\_price numeric(14,2),  
currency text,  
rating numeric(3,2),  
review\_count integer,  
availability text,

primary\_image\_url text,  
image\_storage\_path text,

category\_id uuid references public.categories(id) on delete set null,

priority text not null default 'medium',  
status text not null default 'considering',

reason\_for\_wanting text,  
personal\_notes text,

target\_purchase\_date date,  
target\_budget numeric(14,2),  
amount\_saved numeric(14,2) not null default 0,

extraction\_status text not null default 'manual',  
extraction\_confidence numeric(5,2),  
extraction\_method text,  
extraction\_error text,  
last\_checked\_at timestamptz,

purchased\_at date,  
actual\_purchase\_price numeric(14,2),  
purchase\_reflection text,

is\_archived boolean not null default false,

created\_at timestamptz not null default now(),  
updated\_at timestamptz not null default now()  
);

Constraints:

check (priority in ('low', 'medium', 'high', 'dream'));  
check (  
status in (  
'considering',  
'wanted',  
'saving',  
'ready\_to\_buy',  
'purchased',  
'rejected'  
)  
);  
check (  
extraction\_status in (  
'manual',  
'pending',  
'success',  
'partial',  
'failed'  
)  
);  
check (current\_price is null or current\_price \>= 0);  
check (original\_price is null or original\_price \>= 0);  
check (amount\_saved \>= 0);  
check (rating is null or (rating \>= 0 and rating \<= 5));

Indexes:

create index items\_user\_id\_idx on public.items(user\_id);  
create index items\_user\_status\_idx on public.items(user\_id, status);  
create index items\_user\_created\_at\_idx on public.items(user\_id, created\_at desc);  
create index items\_user\_priority\_idx on public.items(user\_id, priority);  
create index items\_canonical\_url\_idx on public.items(user\_id, canonical\_url);

---

## **9.3 Item images table**

create table public.item\_images (  
id uuid primary key default gen\_random\_uuid(),  
item\_id uuid not null references public.items(id) on delete cascade,  
user\_id uuid not null references auth.users(id) on delete cascade,  
source\_url text,  
storage\_path text,  
alt\_text text,  
position integer not null default 0,  
created\_at timestamptz not null default now()  
);

---

## **9.4 Categories table**

create table public.categories (  
id uuid primary key default gen\_random\_uuid(),  
user\_id uuid not null references auth.users(id) on delete cascade,  
name text not null,  
icon text,  
created\_at timestamptz not null default now(),  
unique(user\_id, name)  
);

Seed common categories for each new user:

- Technology
- Fashion
- Home
- Travel
- Fitness
- Education
- Vehicle
- Experience
- Other

Do not make global categories mandatory. Users must be able to customise them.

---

## **9.5 Collections table**

create table public.collections (  
id uuid primary key default gen\_random\_uuid(),  
user\_id uuid not null references auth.users(id) on delete cascade,  
name text not null,  
description text,  
cover\_image\_url text,  
target\_date date,  
target\_budget numeric(14,2),  
position integer not null default 0,  
created\_at timestamptz not null default now(),  
updated\_at timestamptz not null default now()  
);

---

## **9.6 Item collections junction table**

An item can belong to multiple collections.

create table public.item\_collections (  
item\_id uuid not null references public.items(id) on delete cascade,  
collection\_id uuid not null references public.collections(id) on delete cascade,  
user\_id uuid not null references auth.users(id) on delete cascade,  
created\_at timestamptz not null default now(),  
primary key (item\_id, collection\_id)  
);

---

## **9.7 Price history table**

create table public.price\_history (  
id uuid primary key default gen\_random\_uuid(),  
item\_id uuid not null references public.items(id) on delete cascade,  
user\_id uuid not null references auth.users(id) on delete cascade,  
price numeric(14,2) not null,  
currency text not null,  
availability text,  
checked\_at timestamptz not null default now()  
);

Index:

create index price\_history\_item\_checked\_idx  
on public.price\_history(item\_id, checked\_at desc);

---

## **9.8 Extraction logs table**

create table public.extraction\_logs (  
id uuid primary key default gen\_random\_uuid(),  
user\_id uuid not null references auth.users(id) on delete cascade,  
item\_id uuid references public.items(id) on delete set null,  
requested\_url text not null,  
resolved\_url text,  
domain text,  
status text not null,  
method text,  
fields\_found jsonb not null default '{}'::jsonb,  
error\_code text,  
error\_message text,  
duration\_ms integer,  
created\_at timestamptz not null default now()  
);

Do not expose raw extraction logs in the normal UI. They are for debugging.

---

# **10\. Row Level Security**

Enable RLS on every user-owned table.

Required policy pattern:

alter table public.items enable row level security;

create policy "Users can view their own items"  
on public.items  
for select  
using (auth.uid() \= user\_id);

create policy "Users can create their own items"  
on public.items  
for insert  
with check (auth.uid() \= user\_id);

create policy "Users can update their own items"  
on public.items  
for update  
using (auth.uid() \= user\_id)  
with check (auth.uid() \= user\_id);

create policy "Users can delete their own items"  
on public.items  
for delete  
using (auth.uid() \= user\_id);

Create equivalent policies for:

- Profiles
- Categories
- Collections
- Item collections
- Item images
- Price history
- Extraction logs

Never rely only on frontend filtering.

Never put the Supabase service-role key in frontend code.

---

# **11\. URL extraction backend**

## **11.1 Edge Function name**

extract-product

## **11.2 Request**

{  
"url": "https://example.com/product/example-item"  
}

The function must derive the user identity from the authenticated request. Do not accept `user_id` as a trusted request parameter.

## **11.3 Successful response**

{  
"success": true,  
"data": {  
"requestedUrl": "https://example.com/product/example-item",  
"resolvedUrl": "https://example.com/product/example-item",  
"canonicalUrl": "https://example.com/product/example-item",  
"domain": "example.com",  
"storeName": "Example",  
"title": "Example Product",  
"brand": "Example Brand",  
"description": "Product description",  
"currentPrice": 24999,  
"originalPrice": 29999,  
"currency": "INR",  
"rating": 4.4,  
"reviewCount": 182,  
"availability": "in\_stock",  
"images": \[  
"https://example.com/image-1.jpg"  
\],  
"extractionMethod": "json\_ld",  
"confidence": 0.91,  
"warnings": \[\]  
}  
}

## **11.4 Partial response**

{  
"success": true,  
"data": {  
"title": "Example Product",  
"images": \[  
"https://example.com/image.jpg"  
\],  
"extractionMethod": "open\_graph",  
"confidence": 0.55,  
"warnings": \[  
"Price could not be detected",  
"Rating could not be detected"  
\]  
}  
}

## **11.5 Failure response**

{  
"success": false,  
"error": {  
"code": "PAGE\_BLOCKED",  
"message": "The website did not allow this page to be read."  
},  
"manualEntryAllowed": true  
}

---

# **12\. Extraction pipeline**

Apply extraction in this order.

## **12.1 Validate URL syntax**

Accept only:

https://  
http://

Prefer HTTPS.

Reject:

- `file:`
- `ftp:`
- `data:`
- `javascript:`
- `blob:`
- Custom protocols

## **12.2 Prevent Server-Side Request Forgery**

This is mandatory.

The extraction function must reject URLs targeting:

- `localhost`
- `127.0.0.0/8`
- `0.0.0.0`
- `::1`
- Private IPv4 ranges
- Link-local ranges
- Cloud metadata IP addresses
- Internal hostnames
- Non-public DNS resolutions

Private IPv4 ranges include:

10.0.0.0/8  
172.16.0.0/12  
192.168.0.0/16  
169.254.0.0/16

The function must re-check the resolved destination after redirects.

Limit redirects to a small number, such as three.

## **12.3 Fetch restrictions**

Use:

- A clear user agent
- A request timeout
- Maximum response-body size
- HTML content-type validation
- Redirect limits

Suggested constraints:

Request timeout: 8–12 seconds  
Maximum HTML response: 2–5 MB  
Maximum redirects: 3

Do not download arbitrary large files.

## **12.4 Parse JSON-LD**

Search:

\<script type="application/ld+json"\>

Support:

- Single JSON object
- JSON array
- `@graph`
- `Product`
- `Offer`
- `AggregateOffer`
- `AggregateRating`
- Nested product structures

Normalise:

name \-\> title  
brand.name \-\> brand  
description \-\> description  
image \-\> images  
offers.price \-\> currentPrice  
offers.lowPrice \-\> currentPrice  
offers.highPrice \-\> originalPrice only when context is valid  
offers.priceCurrency \-\> currency  
offers.availability \-\> availability  
aggregateRating.ratingValue \-\> rating  
aggregateRating.reviewCount \-\> reviewCount

Do not assume every numeric field is a valid number. Parse defensively.

## **12.5 Parse Open Graph metadata**

Read:

og:title  
og:description  
og:image  
og:url  
product:price:amount  
product:price:currency

Also inspect common Twitter metadata when useful.

## **12.6 Parse standard metadata**

Fallback fields:

\<title\>  
meta\[name="description"\]  
link\[rel="canonical"\]

## **12.7 Basic DOM heuristics**

Use only conservative heuristics.

Examples:

- Common price classes
- Elements with `itemprop="price"`
- Elements with `itemprop="ratingValue"`
- Main page heading
- High-resolution primary image

Avoid returning a random number as a price.

## **12.8 Domain adapters**

Create an adapter interface:

interface DomainExtractor {  
matches(url: URL): boolean;  
extract(document: Document, url: URL): Partial\<ExtractedProduct\>;  
}

Adapters can later be added for frequently used stores.

Do not hardcode the entire application around Amazon, Flipkart, or one retailer.

## **12.9 Normalisation**

Normalise:

- Whitespace
- HTML entities
- Currency symbols
- Decimal separators
- Relative image URLs
- Protocol-relative URLs
- Availability values
- Duplicate images
- Tracking query parameters

## **12.10 Confidence score**

Example scoring:

Title found: \+0.20  
Primary image found: \+0.20  
Price and currency found: \+0.25  
JSON-LD Product detected: \+0.20  
Brand found: \+0.05  
Rating found: \+0.05  
Canonical URL found: \+0.05

Clamp to:

0.00–1.00

Display confidence indirectly in the UI:

- High confidence
- Check a few details
- Most fields need review

Do not present a technical decimal score to normal users.

---

# **13\. Extraction limitations and browser-rendered pages**

A normal Edge Function fetching HTML will not fully render JavaScript-heavy pages.

Do not attempt to embed a full browser automation system in the initial Lovable build.

MVP behaviour:

1. Attempt server-side HTML extraction.
2. Return partial information when possible.
3. Let the user correct fields.
4. Allow manual image upload.
5. Preserve the original URL.

Later, introduce a third-party browser rendering or extraction service behind the Edge Function. Its API key must remain server-side.

Supabase Edge Functions have runtime resource and duration limits, so heavy browser automation should not be assumed to run reliably inside the basic extraction function. ([Supabase](https://supabase.com/docs/guides/functions/limits?utm_source=chatgpt.com))

---

# **14\. Image handling**

## **MVP**

Store the remote image URL.

Provide:

- Image preview
- Broken-image fallback
- Manual image upload
- Image URL replacement

## **Improved implementation**

Optionally copy selected images into Supabase Storage.

Advantages:

- The item remains visually available when the store changes its image URL.
- Fewer hotlinking failures.
- Better long-term preservation.

Risks:

- Storage costs
- Copyright and store-policy concerns
- Additional image-processing complexity

Recommended storage bucket:

item-images

Suggested path:

{user\_id}/{item\_id}/{uuid}.{extension}

Storage policies must enforce user ownership.

---

# **15\. Duplicate detection**

Before saving, compare:

1. Canonical URL
2. Normalised source URL
3. Domain plus retailer product ID, when detected
4. Title plus brand as a weak fallback

When a probable duplicate exists, show:

This item may already be in your dashboard.

Actions:

- View existing item
- Save another copy
- Cancel

Do not silently block duplicates.

---

# **16\. Search and filtering**

For MVP, use PostgreSQL text search or case-insensitive matching across:

- Title
- Brand
- Store
- Description
- Notes
- Reason for wanting

Filters must be reflected in URL search parameters where practical:

/dashboard?status=saving\&priority=high\&collection=...

This makes browser navigation predictable.

---

# **17\. Savings calculation**

For each item:

remaining\_amount \= max(target\_budget \- amount\_saved, 0\)

Progress:

progress\_percentage \=  
target\_budget \> 0  
? min((amount\_saved / target\_budget) \* 100, 100\)  
: 0

Do not use the current store price as the savings target unless the user explicitly chooses it.

---

# **18\. Price history**

When an item is created with a valid price:

- Insert the current price into `price_history`.

When a refresh finds a new valid price:

- Update `items.current_price`.
- Insert a new `price_history` row only when the price or availability changed.
- Update `last_checked_at`.

Do not overwrite:

- Original saved price
- Target budget
- Actual purchase price

Consider adding an `initial_price` field if historical comparison becomes important.

---

# **19\. Scheduled price refresh**

This is a later-phase feature.

Use scheduled Edge Function calls for refresh batches. Supabase supports scheduled Edge Functions through Postgres scheduling and networking extensions. ([Supabase](https://supabase.com/docs/guides/functions/schedule-functions?utm_source=chatgpt.com))

Do not refresh every item every few minutes.

Recommended starting strategy:

- High-priority items: once daily
- Other active items: once every three to seven days
- Purchased or archived items: never automatically
- Failed domains: apply exponential backoff

Process items in batches.

Store secret tokens securely, not in SQL source or frontend code. Supabase documents secrets and Vault mechanisms for protected configuration. ([Supabase](https://supabase.com/docs/guides/functions/secrets?utm_source=chatgpt.com))

---

# **20\. Error handling**

## **User-facing extraction errors**

Use plain language.

### **Invalid URL**

Enter a complete product link beginning with http:// or https://.

### **Website blocked the request**

This website did not allow us to read the page. You can still add the item manually.

### **No product information found**

We could not identify enough product information from this page. Add the missing details manually.

### **Timeout**

The website took too long to respond. Try again or enter the item manually.

### **Duplicate**

A matching item may already be saved.

Never expose stack traces or internal errors to the user.

---

# **21\. Loading, empty, and failure states**

Every asynchronous view must have:

- Loading state
- Empty state
- Success state
- Partial success state
- Failure state
- Retry path

Use skeleton components for dashboard loading.

Use toast messages only for brief confirmation. Do not rely on toasts for important errors that the user must act on.

---

# **22\. UI and design direction**

## **Visual character**

The application should feel aspirational, calm, premium, and personal.

Avoid:

- Overly corporate dashboards
- Excessive gradients
- Neon colours
- Dense tables as the default
- Gamification that feels childish
- Fake luxury styling
- Excessive animation

## **Layout**

- Spacious card grid
- Large product images
- Strong title hierarchy
- Clear price display
- Soft neutral surfaces
- Responsive sidebar on desktop
- Bottom or drawer navigation on mobile

## **Card contents**

Each item card should show:

- Image
- Title
- Brand or store
- Current price
- Priority
- Status
- Optional savings progress
- Collection indicators
- More-actions menu

Do not overload cards with full descriptions.

## **Responsive breakpoints**

Design for:

- Mobile: one column
- Small tablet: two columns
- Desktop: three or four columns
- Large desktop: four or five columns based on card width

Use consistent card image aspect ratios.

---

# **23\. Accessibility**

Required:

- Semantic HTML
- Keyboard-accessible controls
- Visible focus states
- Form labels
- Accessible dialog behaviour
- Alt text
- Sufficient colour contrast
- Screen-reader-friendly validation
- Do not communicate status using colour alone

All icon-only buttons must have accessible names.

---

# **24\. Security requirements**

## **Mandatory controls**

- Row Level Security on all user data
- Authentication checks in Edge Functions
- No service-role key in the browser
- URL protocol allowlist
- SSRF protection
- Redirect validation
- Response-size limit
- Request timeout
- HTML-only extraction
- Input validation with Zod
- Output sanitisation
- Rate limiting
- Safe external-link attributes
- Secure secrets storage
- No arbitrary script execution

## **Rate limiting**

For initial implementation, enforce a reasonable extraction limit per authenticated user.

Example:

10 extraction requests per minute  
100 extraction requests per day

Store limits in a database table or use a suitable rate-limiting provider later.

Do not expose an unauthenticated public extraction endpoint.

## **HTML sanitisation**

Extract text and URLs only.

Do not store or render arbitrary source-page HTML.

Do not inject webpage markup into React using `dangerouslySetInnerHTML`.

---

# **25\. Performance requirements**

Targets:

- Dashboard remains responsive with at least 500 items.
- Paginate or use infinite loading after approximately 30–50 items.
- Generate appropriately sized image thumbnails.
- Avoid fetching every item’s price history on dashboard load.
- Fetch detailed history only on the detail page.
- Use indexed queries.
- Debounce search input.
- Cache stable queries through TanStack Query.

---

# **26\. Data export and ownership**

Provide a later-phase export feature:

- JSON export
- CSV export
- Image references
- Collections
- Notes
- Price history

Account deletion must clearly explain that it deletes:

- Profile
- Items
- Collections
- Uploaded images
- Price history
- Extraction logs

Use cascading deletion carefully.

---

# **27\. Analytics and observability**

Do not add invasive analytics during the MVP.

At minimum, retain internal operational information:

- Extraction success rate
- Partial extraction rate
- Failure reason
- Domain
- Request duration

Never log:

- Passwords
- Authentication tokens
- Service-role keys
- Complete private headers
- Unnecessary personal data

---

# **28\. MVP acceptance criteria**

The MVP is complete only when all of the following work:

## **Authentication**

- User can create an account.
- User can sign in.
- User can sign out.
- Private routes are protected.
- Password reset works.

## **Item extraction**

- User can paste a valid public URL.
- Backend attempts extraction.
- JSON-LD is supported.
- Open Graph metadata is supported.
- Extracted information appears in an editable preview.
- Extraction errors provide manual entry.
- Unsafe URLs are rejected.

## **Item management**

- User can manually create an item.
- User can edit an item.
- User can delete an item.
- User can archive an item.
- User can mark an item as purchased.
- User can open the source URL.
- User can upload or replace an image.

## **Dashboard**

- Cards load correctly.
- Search works.
- Category filter works.
- Status filter works.
- Priority filter works.
- Sorting works.
- Mobile layout works.
- Empty states work.

## **Organisation**

- User can create categories.
- User can create collections.
- User can add an item to multiple collections.
- Deleting a collection does not delete its items.

## **Security**

- Users cannot access another account’s data.
- Service keys are not present in frontend files.
- Extraction function blocks private/internal destinations.
- All inputs are validated.

---

# **29\. Features explicitly excluded from MVP**

Do not build these until the core system is stable:

- Social feed
- Public profiles
- Friend following
- Affiliate links
- Automated purchasing
- Browser extension
- Mobile-native application
- AI recommendations
- AI-generated financial advice
- Currency conversion
- Complex price alerts
- Full browser automation
- Store-login support
- Ecommerce checkout
- Payments
- Shared family accounts
- Public collection sharing

---

# **30\. Recommended implementation phases**

## **Phase 1: Foundation**

Build:

- Project structure
- Design system
- Authentication
- Protected routes
- Database schema
- RLS policies
- Empty dashboard
- Seed categories

## **Phase 2: Manual item system**

Build:

- Manual item creation
- Item cards
- Item detail page
- Edit
- Delete
- Archive
- Purchase status
- Image upload

Do this before automatic extraction. It guarantees that the product remains usable even when scraping fails.

## **Phase 3: URL extraction**

Build:

- `extract-product` Edge Function
- URL validation
- SSRF protection
- JSON-LD parser
- Open Graph parser
- Preview workflow
- Extraction logs
- Partial and failed states

## **Phase 4: Organisation**

Build:

- Categories
- Collections
- Search
- Filters
- Sorting
- Dashboard summary

## **Phase 5: Planning**

Build:

- Target dates
- Target budgets
- Savings tracking
- Purchased archive
- Reflections

## **Phase 6: Price tracking**

Build:

- Manual refresh
- Price history
- Price chart
- Scheduled refresh
- Failure backoff

## **Phase 7: Hardening**

Complete:

- Security review
- RLS verification
- Mobile testing
- Accessibility
- Performance
- Automated tests
- Production error handling

---

# **31\. Testing strategy**

## **Unit tests**

Test:

- URL normalisation
- Currency parsing
- Price parsing
- JSON-LD parsing
- Open Graph parsing
- Availability normalisation
- Duplicate detection
- Savings calculations

## **Integration tests**

Test:

- Authenticated item creation
- RLS isolation
- Collection associations
- Item deletion cascade
- Extraction response handling
- Price-history insertion

## **End-to-end tests**

Use Playwright after code export.

Critical scenarios:

1. Sign up and sign in.
2. Add an item manually.
3. Add an item through a parseable URL.
4. Handle an extraction failure.
5. Edit an item.
6. Add it to a collection.
7. Search for it.
8. Mark it purchased.
9. Archive another item.
10. Verify another user cannot access it.

## **Security tests**

Test URLs resolving to:

- Localhost
- Private IPv4 addresses
- IPv6 loopback
- Cloud metadata endpoints
- Redirects from public URLs to private addresses
- Large files
- Non-HTML content
- Slow responses

---

# **32\. Suggested repository structure**

src/  
components/  
auth/  
dashboard/  
items/  
collections/  
layout/  
shared/  
ui/

pages/  
LandingPage.tsx  
SignInPage.tsx  
SignUpPage.tsx  
DashboardPage.tsx  
AddItemPage.tsx  
ItemDetailsPage.tsx  
CollectionsPage.tsx  
CollectionDetailsPage.tsx  
PurchasedPage.tsx  
ArchivedPage.tsx  
SettingsPage.tsx  
NotFoundPage.tsx

hooks/  
useAuth.ts  
useItems.ts  
useCollections.ts  
useCategories.ts  
useProductExtraction.ts

lib/  
supabase.ts  
queryClient.ts  
validation.ts  
currency.ts  
urls.ts  
errors.ts

services/  
itemService.ts  
collectionService.ts  
extractionService.ts

types/  
database.ts  
item.ts  
extraction.ts

routes/  
AppRouter.tsx  
ProtectedRoute.tsx

supabase/  
functions/  
extract-product/  
index.ts  
parsers/  
jsonLd.ts  
openGraph.ts  
metadata.ts  
normalise.ts  
security.ts  
adapters/  
migrations/  
seed.sql

tests/  
unit/  
integration/  
e2e/

---

# **33\. Environment variables**

Frontend-safe variables:

VITE\_SUPABASE\_URL  
VITE\_SUPABASE\_PUBLISHABLE\_KEY

Backend-only secrets:

SUPABASE\_SERVICE\_ROLE\_KEY  
EXTRACTION\_PROVIDER\_API\_KEY  
RATE\_LIMIT\_PROVIDER\_TOKEN

Never prefix backend secrets with `VITE_`.

Anything prefixed with `VITE_` can become accessible to browser code.

Configure production values in Vercel and Supabase dashboards rather than committing `.env` files. Vercel supports environment-specific variables, and Supabase Edge Functions support server-side secrets. ([Vercel](https://vercel.com/docs/environment-variables?utm_source=chatgpt.com))

Include:

.env.example

Do not commit:

.env  
.env.local  
.env.production

---

# **34\. Vercel deployment requirements**

After exporting to GitHub:

1. Import the GitHub repository into Vercel.
2. Confirm framework detection as Vite.
3. Configure build command:

npm run build

4. Configure output directory:

dist

5. Add frontend-safe Supabase environment variables.
6. Configure SPA route rewrites when required.
7. Deploy preview environment.
8. Test authentication redirect URLs.
9. Add the production domain to Supabase Auth allowed URLs.
10. Deploy production.

For a single-page React application, ensure direct navigation to routes such as `/dashboard` and `/items/:id` returns the application entry point rather than a 404\.

Example `vercel.json`:

{  
"$schema": "https://openapi.vercel.sh/vercel.json",  
"rewrites": \[  
{  
"source": "/(.\*)",  
"destination": "/index.html"  
}  
\]  
}

Confirm this configuration against the final framework and router generated by Lovable. Vercel automatically detects frameworks but also supports explicit project configuration where required. ([Vercel](https://vercel.com/docs/project-configuration?utm_source=chatgpt.com))

---

# **35\. GitHub and local workflow**

Lovable should be connected to GitHub early, not only at the end.

Workflow:

Lovable  
↓  
GitHub repository  
↓  
Local clone  
↓  
Feature branch  
↓  
Codex-assisted changes  
↓  
Tests and local verification  
↓  
Pull request  
↓  
Vercel preview  
↓  
Production

Commands:

git clone \<repository-url\>  
cd \<repository-name\>  
npm install  
cp .env.example .env.local  
npm run dev

Before production:

npm run lint  
npm run typecheck  
npm run test  
npm run build

Add missing scripts if Lovable does not create them.

---

# **36\. Codex workflow after export**

Use Codex for narrow, verifiable tasks instead of asking it to “finish the entire app.”

Recommended task sequence:

1. Audit the repository architecture.
2. Audit TypeScript errors.
3. Audit Supabase RLS.
4. Audit extraction security.
5. Add parser tests.
6. Add Playwright tests.
7. Fix mobile UI defects.
8. Optimise database queries.
9. Review environment-variable usage.
10. Review the Vercel deployment configuration.

OpenAI describes Codex as capable of working with codebases, implementing features, fixing bugs, and proposing changes. The Codex CLI runs locally against a codebase. ([OpenAI](https://openai.com/index/introducing-codex/?utm_source=chatgpt.com))

Example Codex task:

Audit the extract-product Supabase Edge Function.

Objectives:  
1\. Identify SSRF vulnerabilities.  
2\. Reject localhost, private IP ranges, link-local addresses and metadata endpoints.  
3\. Revalidate every redirect target.  
4\. Limit redirects, body size and request duration.  
5\. Add unit tests for malicious URLs.  
6\. Do not change unrelated UI code.  
7\. Run the relevant tests and report exactly what changed.

---

# **37\. Lovable build instructions**

Do not send the entire project as one giant prompt and expect a reliable result.

Use the specification as the Knowledge file, then execute the following prompts sequentially.

## **Lovable Prompt 1: Architecture and foundation**

Read the complete AspireList technical specification in the project Knowledge file.

Start with Phase 1 only.

Build the React, TypeScript and Vite application foundation using Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form and Zod.

Connect the project to Supabase.

Implement:  
\- Public landing page  
\- Sign-up page  
\- Sign-in page  
\- Password-reset flow  
\- Protected application routes  
\- Responsive authenticated layout  
\- Empty dashboard  
\- Settings placeholder  
\- Profiles table  
\- Categories table  
\- Items table  
\- Collections table  
\- Item collections table  
\- Item images table  
\- Price history table  
\- Extraction logs table  
\- Database indexes  
\- Updated-at handling  
\- Complete Row Level Security policies

Do not implement URL extraction yet.

Before changing code, explain the planned files, tables, routes and RLS policies. Then implement them.

After implementation:  
\- Check TypeScript  
\- Check all imports  
\- Check authentication redirects  
\- Check RLS  
\- Report remaining issues

## **Lovable Prompt 2: Manual item management**

Implement Phase 2 from the AspireList specification.

Build:  
\- Manual add-item form  
\- Item card grid  
\- Item list view  
\- Item detail page  
\- Edit-item form  
\- Delete confirmation  
\- Archive and restore actions  
\- Mark-as-purchased flow  
\- Purchased-items page  
\- Archived-items page  
\- Image upload to a private Supabase Storage bucket  
\- Broken-image placeholder  
\- Loading, empty, success and failure states

Use React Hook Form and Zod.

Every database operation must be scoped to the authenticated user and protected by RLS.

Do not implement automatic URL extraction yet.

After implementation, inspect the full flow from manual creation through purchase and fix any broken routes, types or database calls.

## **Lovable Prompt 3: Collections and dashboard**

Implement the AspireList collections and dashboard requirements.

Build:  
\- Category management  
\- Collection creation, editing and deletion  
\- Many-to-many item-to-collection association  
\- Collection detail pages  
\- Dashboard summary metrics  
\- Search  
\- Status filter  
\- Priority filter  
\- Category filter  
\- Collection filter  
\- Store filter  
\- Sorting  
\- Grid/list display toggle  
\- Responsive mobile navigation

Deleting a collection must never delete its items.

Store active filters in URL search parameters where practical.

Do not implement automatic URL extraction yet.

Test with at least 20 seeded development items and then remove any insecure public seed data.

## **Lovable Prompt 4: Extraction Edge Function**

Implement the extract-product Supabase Edge Function described in the AspireList specification.

Security is mandatory.

Requirements:  
\- Authenticated requests only  
\- Accept only HTTP and HTTPS URLs  
\- Reject localhost, private IP ranges, link-local addresses, internal hostnames and cloud metadata addresses  
\- Resolve and validate DNS destinations  
\- Revalidate all redirect destinations  
\- Maximum three redirects  
\- Request timeout  
\- Maximum HTML response size  
\- Require HTML content type  
\- Never execute remote scripts  
\- Never return raw source-page HTML  
\- Record safe extraction logs

Extraction order:  
1\. JSON-LD Product data  
2\. Open Graph metadata  
3\. Standard metadata  
4\. Conservative DOM heuristics  
5\. Domain-adapter interface

Return normalised product data, extraction method, confidence and warnings.

Create modular parser files and unit-testable pure functions.

Do not build a headless browser.

Before implementation, explain the threat model and extraction flow. After implementation, review the function specifically for SSRF vulnerabilities.

## **Lovable Prompt 5: URL import interface**

Connect the add-item interface to the extract-product Edge Function.

Build:  
\- Product URL input  
\- Basic client-side URL validation  
\- Extraction loading state  
\- Editable extraction preview  
\- Partial extraction warnings  
\- Retry action  
\- Manual-entry fallback  
\- Duplicate detection  
\- Save action  
\- Extraction status fields  
\- Last-checked information

The user must be able to edit every extracted field before saving.

Extraction failure must never block manual saving.

Do not display raw technical errors or confidence decimals. Translate extraction confidence into understandable review guidance.

## **Lovable Prompt 6: Savings and planning**

Implement the personal planning features from the AspireList specification.

Add:  
\- Why I want this  
\- Personal notes  
\- Priority  
\- Target purchase date  
\- Target budget  
\- Amount saved  
\- Savings progress  
\- Remaining amount  
\- Ready-to-buy status  
\- Purchase date  
\- Actual purchase price  
\- Purchase reflection

Ensure calculations handle null and zero values correctly.

Do not combine totals across different currencies.

## **Lovable Prompt 7: Final audit**

Perform a production-readiness audit of the entire AspireList application.

Do not add new product features.

Audit and fix:  
\- TypeScript errors  
\- Broken imports  
\- Route failures  
\- Authentication redirects  
\- Supabase query failures  
\- RLS gaps  
\- Cross-user access risks  
\- Exposed secrets  
\- SSRF risks  
\- Unsafe external links  
\- Missing validation  
\- Mobile-layout defects  
\- Accessibility defects  
\- Loading and error states  
\- Empty states  
\- Build failures  
\- Console errors  
\- Unhandled promise rejections

Generate a final report containing:  
\- Files changed  
\- Database migrations  
\- Required secrets  
\- Remaining limitations  
\- Manual deployment steps  
\- Known extraction limitations

---

# **38\. Definition of production-ready**

The project is not production-ready merely because Lovable displays a working preview.

It is production-ready only when:

- Production build succeeds.
- Type checking succeeds.
- RLS is manually verified.
- A second test account cannot read the first account’s data.
- Malicious extraction URLs are blocked.
- No secret exists in browser JavaScript.
- Authentication redirects work on the Vercel domain.
- Direct navigation to application routes works.
- Manual item entry works when extraction fails.
- Mobile layouts are usable.
- Database migrations are committed.
- Environment-variable documentation is complete.
- Critical user journeys have automated tests.
- Error logs are inspectable.
- Account data can be deleted.

---

# **39\. Final product rule**

Automatic extraction is an enhancement.

The permanent user-owned item record is the product.

The system must remain useful even when:

- A retailer blocks extraction.
- A source URL expires.
- A product is removed.
- An image breaks.
- A price cannot be found.
- A store changes its website.

For that reason, editable fields, image uploads, personal notes, collections, purchase planning, and archival history are not secondary features. They are the durable foundation of the application.

The correct build order is **manual item system first, extraction second**. Starting with scraping would be a mistake: you would spend most of your Lovable credits debugging retailer restrictions before the underlying application is usable. Lovable itself recommends establishing project foundations and using planning before complex database or backend changes. ([Lovable Documentation](https://docs.lovable.dev/tips-tricks/best-practice?utm_source=chatgpt.com))

# **AspireList**

## **Free, Local-First Personal Wishlist and Life Acquisition Dashboard**

**Document version:** 2.0  
**Primary builder:** Lovable  
**Frontend:** React, TypeScript and Vite  
**UI:** Tailwind CSS and shadcn/ui  
**Permanent local storage:** IndexedDB  
**IndexedDB library:** Dexie.js  
**Optional extraction backend:** Cloudflare Worker Free Plan  
**Application hosting:** Vercel Hobby or Cloudflare Pages  
**Source control:** GitHub  
**Local completion:** Codex and VS Code  
**Recurring mandatory cost:** None  
**Authentication:** Excluded from the local-first version  
**Primary use case:** One person managing a private visual list of desired purchases

---

# **1\. Non-negotiable architecture decision**

AspireList must be built as a local-first application.

All personal information must be stored inside the user’s browser using IndexedDB.

The application must not require:

- A paid database
- Supabase
- Firebase
- MongoDB Atlas
- A paid authentication provider
- A paid storage provider
- A paid scraping API
- A paid image provider
- A paid AI API
- A permanent backend server
- A monthly subscription

The deployed application must work as a static website.

The only optional server-side component is a small Cloudflare Worker that attempts to read publicly accessible product metadata from a URL.

The core application must remain completely usable when that Worker is unavailable.

---

# **2\. Reality of “free forever”**

No third-party platform can guarantee that its free plan will exist forever.

Therefore, AspireList must not depend on any hosting company for ownership of the user’s data.

The user must be able to:

- Export all application data
- Import all application data
- Download a backup file
- Move the application to another host
- Run the application locally
- Continue using the application without the extraction Worker
- Manually create and edit every item

The durable asset is the exported source code and backup data, not the free hosting provider.

---

# **3\. Product definition**

AspireList is a private visual application where a user records everything they want to buy or achieve.

Examples include:

- Electronics
- Fashion
- Furniture
- Vehicles
- Courses
- Travel
- Experiences
- Property ideas
- Fitness equipment
- Gifts
- Career tools
- Luxury goals

The user may paste a webpage URL.

The application attempts to retrieve:

- Product name
- Product image
- Price
- Currency
- Brand
- Description
- Store
- Rating
- Review count
- Availability
- Original URL

The user reviews and edits the retrieved information before saving it.

If extraction fails, the user must still be able to create the item manually.

---

# **4\. Product principles**

## **4.1 Manual entry is the foundation**

Automatic extraction is optional assistance.

The application must never become unusable because:

- A store blocks extraction
- A product page requires JavaScript
- The product is removed
- A URL expires
- An image stops loading
- A price cannot be detected
- Cloudflare is unavailable
- The user has no internet connection

## **4.2 Data belongs to the user**

All stored data must be exportable as JSON.

## **4.3 CRUD must be complete**

Every main entity must support:

- Create
- Read
- Update
- Delete

## **4.4 Deletion must be real**

The user must be able to permanently delete fulfilled, rejected, irrelevant, or mistaken entries.

The application must show a confirmation before destructive deletion.

## **4.5 Purchased and deleted are different**

A fulfilled item can either be:

- Marked as purchased and preserved as an achievement
- Archived
- Permanently deleted

The application must not automatically delete purchased items.

---

# **5\. Recommended technology stack**

## **5.1 Core stack**

Use only:

React  
TypeScript  
Vite  
React Router  
Tailwind CSS  
shadcn/ui  
Lucide React  
Dexie.js  
Zod  
React Hook Form  
date-fns  
Recharts

## **5.2 Why this stack**

### **React**

Common, maintainable and well supported.

### **TypeScript**

Reduces data-shape and refactoring errors.

### **Vite**

Produces a simple static frontend and runs quickly during development.

### **Dexie.js**

Provides a cleaner interface over IndexedDB.

It supports:

- Local persistence
- Indexed queries
- Transactions
- Database schema versions
- CRUD operations
- Large collections
- Blob storage

### **React Hook Form and Zod**

Provide controlled forms and predictable validation.

### **Tailwind CSS and shadcn/ui**

Allow Lovable to create a consistent UI without writing a custom design system.

### **Recharts**

Can be used later for price-history and savings charts.

---

# **6\. Technologies explicitly excluded**

Do not introduce the following during the initial build:

Next.js  
Redux  
Zustand  
Supabase  
Firebase  
MongoDB  
Prisma  
Drizzle  
Node.js backend  
Express  
NestJS  
GraphQL  
Docker  
Kubernetes  
Stripe  
Clerk  
Auth0  
OpenAI API  
Paid scraping APIs  
Paid image hosting

These are unnecessary for a private local-first wishlist.

React Context is permitted only for lightweight application settings. Do not create complex global state management.

---

# **7\. System architecture**

User browser  
│  
├── React application  
│ ├── Dashboard  
│ ├── Add item  
│ ├── Item details  
│ ├── Collections  
│ ├── Purchased items  
│ ├── Archived items  
│ ├── Backup and restore  
│ └── Settings  
│  
├── IndexedDB through Dexie.js  
│ ├── Items  
│ ├── Collections  
│ ├── Categories  
│ ├── Item-collection relations  
│ ├── Price history  
│ ├── Stored images  
│ └── Application settings  
│  
└── Optional Cloudflare Worker  
├── URL security validation  
├── HTML retrieval  
├── JSON-LD parsing  
├── Open Graph parsing  
└── Normalised metadata response

The application must not require the Cloudflare Worker to start, load, read data, update data, delete data, export data, or restore data.

---

# **8\. Data persistence model**

## **8.1 IndexedDB database name**

aspirelist

## **8.2 Dexie database version**

Start with:

Version 1

Every future schema change must create a new Dexie version and migration.

Never modify an existing released schema without a version upgrade.

---

# **9\. TypeScript domain models**

## **9.1 Item model**

export type ItemPriority \= "low" | "medium" | "high" | "dream";

export type ItemStatus \=  
| "considering"  
| "wanted"  
| "saving"  
| "ready\_to\_buy"  
| "purchased"  
| "rejected";

export type ExtractionStatus \=  
| "not\_attempted"  
| "pending"  
| "success"  
| "partial"  
| "failed"  
| "manual";

export interface WishlistItem {  
id: string;

title: string;  
brand?: string;  
description?: string;

sourceUrl?: string;  
canonicalUrl?: string;  
sourceDomain?: string;  
storeName?: string;

currentPrice?: number;  
originalPrice?: number;  
currency?: string;

initialPrice?: number;  
actualPurchasePrice?: number;

rating?: number;  
reviewCount?: number;  
availability?: string;

primaryImageId?: string;  
remoteImageUrl?: string;

categoryId?: string;

priority: ItemPriority;  
status: ItemStatus;

reasonForWanting?: string;  
personalNotes?: string;

targetPurchaseDate?: string;  
targetBudget?: number;  
amountSaved: number;

purchasedAt?: string;  
purchaseReflection?: string;

extractionStatus: ExtractionStatus;  
extractionMethod?: string;  
extractionConfidence?: number;  
extractionWarnings?: string\[\];  
extractionError?: string;  
lastCheckedAt?: string;

isArchived: boolean;

createdAt: string;  
updatedAt: string;  
}

---

## **9.2 Category model**

export interface Category {  
id: string;  
name: string;  
icon?: string;  
position: number;  
createdAt: string;  
updatedAt: string;  
}

---

## **9.3 Collection model**

export interface Collection {  
id: string;  
name: string;  
description?: string;  
coverImageId?: string;  
targetDate?: string;  
targetBudget?: number;  
position: number;  
createdAt: string;  
updatedAt: string;  
}

---

## **9.4 Item-to-collection relation**

export interface ItemCollection {  
id: string;  
itemId: string;  
collectionId: string;  
createdAt: string;  
}

The relation ID should be deterministic or uniquely generated.

A combination of `itemId` and `collectionId` must not be saved more than once.

---

## **9.5 Price history model**

export interface PriceHistoryRecord {  
id: string;  
itemId: string;  
price: number;  
currency: string;  
availability?: string;  
checkedAt: string;  
}

---

## **9.6 Image model**

export interface StoredImage {  
id: string;  
itemId?: string;  
collectionId?: string;

fileName: string;  
mimeType: string;  
size: number;

blob: Blob;

createdAt: string;  
}

Do not save Base64 images inside item records.

Store image files as Blob objects in a dedicated IndexedDB table.

---

## **9.7 Application settings**

export type ThemePreference \= "system" | "light" | "dark";  
export type DashboardView \= "grid" | "list";

export interface AppSettings {  
id: "primary";  
appName: string;  
defaultCurrency: string;  
theme: ThemePreference;  
defaultView: DashboardView;  
showPurchasedOnDashboard: boolean;  
showArchivedOnDashboard: boolean;  
extractionWorkerUrl?: string;  
lastBackupAt?: string;  
createdAt: string;  
updatedAt: string;  
}

---

# **10\. Dexie schema**

Create:

import Dexie, { type Table } from "dexie";

export class AspireListDatabase extends Dexie {  
items\!: Table\<WishlistItem, string\>;  
categories\!: Table\<Category, string\>;  
collections\!: Table\<Collection, string\>;  
itemCollections\!: Table\<ItemCollection, string\>;  
priceHistory\!: Table\<PriceHistoryRecord, string\>;  
images\!: Table\<StoredImage, string\>;  
settings\!: Table\<AppSettings, string\>;

constructor() {  
super("aspirelist");

    this.version(1).stores({
      items:
        "id, title, brand, storeName, categoryId, priority, status, isArchived, createdAt, updatedAt, sourceDomain, canonicalUrl",
      categories:
        "id, \&name, position, createdAt, updatedAt",
      collections:
        "id, \&name, position, createdAt, updatedAt",
      itemCollections:
        "id, itemId, collectionId, &\[itemId+collectionId\], createdAt",
      priceHistory:
        "id, itemId, \[itemId+checkedAt\], checkedAt",
      images:
        "id, itemId, collectionId, createdAt",
      settings:
        "id"
    });

}  
}

export const db \= new AspireListDatabase();

Indexes must support dashboard filtering without loading every item and manually scanning all records.

---

# **11\. Repository structure**

src/  
├── app/  
│ ├── App.tsx  
│ ├── router.tsx  
│ └── providers.tsx  
│  
├── components/  
│ ├── layout/  
│ ├── items/  
│ ├── collections/  
│ ├── categories/  
│ ├── backup/  
│ ├── settings/  
│ ├── feedback/  
│ └── ui/  
│  
├── pages/  
│ ├── DashboardPage.tsx  
│ ├── AddItemPage.tsx  
│ ├── EditItemPage.tsx  
│ ├── ItemDetailsPage.tsx  
│ ├── CollectionsPage.tsx  
│ ├── CollectionDetailsPage.tsx  
│ ├── CategoriesPage.tsx  
│ ├── PurchasedPage.tsx  
│ ├── ArchivedPage.tsx  
│ ├── BackupPage.tsx  
│ ├── SettingsPage.tsx  
│ └── NotFoundPage.tsx  
│  
├── db/  
│ ├── database.ts  
│ ├── migrations.ts  
│ └── seed.ts  
│  
├── repositories/  
│ ├── itemRepository.ts  
│ ├── categoryRepository.ts  
│ ├── collectionRepository.ts  
│ ├── priceHistoryRepository.ts  
│ ├── imageRepository.ts  
│ └── settingsRepository.ts  
│  
├── services/  
│ ├── extractionService.ts  
│ ├── backupService.ts  
│ ├── imageService.ts  
│ └── duplicateService.ts  
│  
├── hooks/  
│ ├── useItems.ts  
│ ├── useItem.ts  
│ ├── useCategories.ts  
│ ├── useCollections.ts  
│ ├── useImageUrl.ts  
│ └── useSettings.ts  
│  
├── schemas/  
│ ├── itemSchema.ts  
│ ├── categorySchema.ts  
│ ├── collectionSchema.ts  
│ ├── extractionSchema.ts  
│ └── backupSchema.ts  
│  
├── types/  
│ ├── item.ts  
│ ├── category.ts  
│ ├── collection.ts  
│ ├── extraction.ts  
│ └── backup.ts  
│  
├── utils/  
│ ├── currency.ts  
│ ├── dates.ts  
│ ├── urls.ts  
│ ├── ids.ts  
│ ├── calculations.ts  
│ └── errors.ts  
│  
└── main.tsx

worker/  
├── src/  
│ ├── index.ts  
│ ├── security.ts  
│ ├── fetchPage.ts  
│ ├── normalise.ts  
│ └── parsers/  
│ ├── jsonLd.ts  
│ ├── openGraph.ts  
│ └── standardMetadata.ts  
│  
├── wrangler.jsonc  
├── package.json  
└── tsconfig.json

tests/  
├── unit/  
├── integration/  
└── e2e/

---

# **12\. Routes**

/ Redirect to /dashboard  
/dashboard All active items  
/items/new Add an item  
/items/:itemId View item  
/items/:itemId/edit Edit item  
/collections View collections  
/collections/:collectionId  
/categories Manage categories  
/purchased Purchased items  
/archived Archived items  
/backup Backup and restore  
/settings Application settings  
/help Offline help and limitations  
/\* Not-found page

No authentication routes are required in the local-first version.

---

# **13\. Complete CRUD requirements**

## **13.1 Item CRUD**

### **Create**

The user can create an item through:

- Manual form
- URL extraction followed by editable preview
- Import from backup

Required fields:

- Title
- Priority
- Status

Everything else is optional.

### **Read**

The user can read items through:

- Dashboard
- Search
- Filters
- Collection page
- Purchased page
- Archived page
- Item detail page

### **Update**

The user can update every editable item field.

Updating an item must change `updatedAt`.

### **Delete**

The user can permanently delete an item.

Before deletion, show:

Permanently delete this item?

This will remove the item, its stored images, collection associations,  
and price history. This action cannot be undone.

Delete the item and related records inside one Dexie transaction.

await db.transaction(  
"rw",  
\[  
db.items,  
db.itemCollections,  
db.priceHistory,  
db.images  
\],  
async () \=\> {  
await db.itemCollections.where("itemId").equals(itemId).delete();  
await db.priceHistory.where("itemId").equals(itemId).delete();  
await db.images.where("itemId").equals(itemId).delete();  
await db.items.delete(itemId);  
}  
);

---

## **13.2 Category CRUD**

The user must be able to:

- Create a category
- View categories
- Rename a category
- Change its icon
- Reorder categories
- Delete a category

Deleting a category must not delete items.

When deleting a category:

- Set affected item `categoryId` values to `undefined`
- Then delete the category

Use one transaction.

---

## **13.3 Collection CRUD**

The user must be able to:

- Create a collection
- View a collection
- Edit its name and details
- Add items
- Remove items
- Reorder collections
- Delete a collection

Deleting a collection must:

- Delete item-collection relations
- Delete its stored cover image
- Preserve the items

---

## **13.4 Price-history CRUD**

The application normally creates price-history records automatically.

The user must also be able to:

- View price history
- Correct an incorrect record
- Delete a price record
- Clear all price history for one item

---

# **14\. Item lifecycle**

An item may move through:

considering  
→ wanted  
→ saving  
→ ready\_to\_buy  
→ purchased

Alternative states:

rejected  
archived  
deleted

## **Purchased**

Purchased means the goal was fulfilled and its record remains.

## **Rejected**

Rejected means the user intentionally decided not to purchase it.

## **Archived**

Archived means hidden from the normal dashboard but recoverable.

## **Deleted**

Deleted means permanently removed.

---

# **15\. Add-item workflow**

## **Step 1: Choose entry method**

Show two equal options:

Paste a link  
Enter manually

Do not hide manual entry.

## **Step 2A: Paste a link**

User enters a URL.

Validate:

- Must begin with `http://` or `https://`
- Must have a valid hostname
- Maximum reasonable length
- Reject malformed URLs

## **Step 2B: Manual entry**

Open the full form immediately.

## **Step 3: Extraction**

When link extraction is requested:

1. Send URL to the configured Worker.
2. Show a loading state.
3. Set a timeout.
4. Handle success, partial success or failure.
5. Display an editable preview.
6. Never save automatically.

## **Step 4: Review**

Every extracted field must be editable.

## **Step 5: Save**

Save only after the user explicitly selects `Save item`.

---

# **16\. Item form fields**

## **Product information**

- Title
- Brand
- Description
- Store name
- Source URL
- Current price
- Original price
- Currency
- Rating
- Review count
- Availability
- Product image

## **Personal information**

- Category
- Collections
- Priority
- Status
- Why I want this
- Personal notes
- Target purchase date
- Target budget
- Amount saved

## **Purchase information**

Only display when status is `purchased`:

- Purchase date
- Actual purchase price
- Purchase reflection

---

# **17\. Validation rules**

Use Zod.

export const itemFormSchema \= z.object({  
title: z  
.string()  
.trim()  
.min(1, "Enter an item name.")  
.max(200),

brand: z.string().trim().max(120).optional(),  
description: z.string().trim().max(5000).optional(),

sourceUrl: z  
.string()  
.trim()  
.url()  
.refine(  
value \=\>  
value.startsWith("https://") ||  
value.startsWith("http://"),  
"Use an HTTP or HTTPS link."  
)  
.optional()  
.or(z.literal("")),

currentPrice: z.number().nonnegative().optional(),  
originalPrice: z.number().nonnegative().optional(),

currency: z  
.string()  
.trim()  
.length(3)  
.transform(value \=\> value.toUpperCase())  
.optional(),

rating: z.number().min(0).max(5).optional(),  
reviewCount: z.number().int().nonnegative().optional(),

priority: z.enum(\["low", "medium", "high", "dream"\]),

status: z.enum(\[  
"considering",  
"wanted",  
"saving",  
"ready\_to\_buy",  
"purchased",  
"rejected"  
\]),

amountSaved: z.number().nonnegative().default(0),  
targetBudget: z.number().nonnegative().optional(),

reasonForWanting: z.string().trim().max(2000).optional(),  
personalNotes: z.string().trim().max(5000).optional()  
});

Additional rules:

- `originalPrice` may be lower than `currentPrice`; do not block save, but show a warning.
- `amountSaved` may exceed `targetBudget`; cap only the visual progress bar.
- Purchase date is required when an item is marked purchased.
- Actual purchase price is optional.
- Empty strings must be converted to `undefined` before storage.

---

# **18\. Dashboard**

## **Summary cards**

Display:

- Active items
- High-priority items
- Saving items
- Purchased items

Display wishlist totals grouped by currency.

Correct:

₹240,000 INR  
$1,800 USD  
€400 EUR

Incorrect:

Total wishlist value: 242,200

Never add unrelated currencies together.

## **Item grid**

Each card shows:

- Image
- Title
- Brand or store
- Price
- Priority
- Status
- Savings progress when applicable
- Collection badges
- More-actions menu

## **Card actions**

- View
- Edit
- Mark purchased
- Archive
- Delete

## **Search fields**

Search:

- Title
- Brand
- Store
- Description
- Personal notes
- Reason for wanting

## **Filters**

- Status
- Priority
- Category
- Collection
- Store
- Price range
- Currency
- Date added

## **Sorting**

- Newest
- Oldest
- Recently updated
- Price low to high
- Price high to low
- Priority
- Target purchase date
- Alphabetical

## **Views**

- Grid
- List

Persist the selected view in settings.

---

# **19\. Reactive IndexedDB queries**

Use Dexie’s `useLiveQuery` where suitable.

Example:

const items \= useLiveQuery(  
() \=\>  
db.items  
.where("isArchived")  
.equals(0)  
.reverse()  
.sortBy("createdAt"),  
\[\],  
\[\]  
);

Do not copy the complete database into global React state.

The database is the source of truth.

React state should hold only temporary interface state such as:

- Open dialog
- Current filter
- Form values
- Selected card
- Search term

---

# **20\. Repository layer**

Page components must not contain large IndexedDB queries.

Create repository functions.

Example:

export async function createItem(  
input: CreateWishlistItemInput  
): Promise\<WishlistItem\> {  
const timestamp \= new Date().toISOString();

const item: WishlistItem \= {  
...input,  
id: crypto.randomUUID(),  
amountSaved: input.amountSaved ?? 0,  
isArchived: false,  
extractionStatus: input.extractionStatus ?? "manual",  
createdAt: timestamp,  
updatedAt: timestamp  
};

await db.items.add(item);

if (  
item.currentPrice \!== undefined &&  
item.currency  
) {  
await db.priceHistory.add({  
id: crypto.randomUUID(),  
itemId: item.id,  
price: item.currentPrice,  
currency: item.currency,  
availability: item.availability,  
checkedAt: timestamp  
});  
}

return item;  
}

Repository functions must throw structured application errors.

---

# **21\. Image strategy**

## **21.1 Supported image sources**

The application supports:

- Remote image URL
- Local file upload
- Image pasted from clipboard, when supported
- Existing stored image

## **21.2 Recommended priority**

1. User-uploaded local image
2. Stored downloaded image
3. Remote product image
4. Placeholder

## **21.3 Image resizing**

Before storing a user-uploaded image:

- Validate MIME type
- Reject unsupported files
- Resize very large images in the browser
- Compress to WebP or JPEG
- Store the result as a Blob
- Preserve acceptable visual quality

Suggested maximum dimensions:

1600 × 1600 pixels

Suggested target size:

Under 1 MB where practical

Do not store the original 10–20 MB camera file when a smaller visual copy is sufficient.

## **21.4 Object URL cleanup**

When displaying Blob images:

const url \= URL.createObjectURL(blob);

Always clean up:

URL.revokeObjectURL(url);

Prevent browser-memory leaks.

---

# **22\. Backup system**

Backup is mandatory, not optional.

Local browser data can be lost when:

- Browser storage is cleared
- The browser is uninstalled
- The device fails
- Private browsing is used
- The user switches devices
- Storage is automatically evicted
- The application origin changes

## **22.1 Backup formats**

Support:

- Full JSON backup
- Human-readable CSV item export

JSON is the authoritative restore format.

CSV is for viewing and spreadsheet use, not complete restoration.

## **22.2 Backup file structure**

export interface AspireListBackup {  
format: "aspirelist-backup";  
version: 1;  
exportedAt: string;  
applicationVersion: string;

data: {  
items: WishlistItem\[\];  
categories: Category\[\];  
collections: Collection\[\];  
itemCollections: ItemCollection\[\];  
priceHistory: PriceHistoryRecord\[\];  
settings: AppSettings\[\];  
};

images: BackupImage\[\];  
}

Because JSON cannot directly contain Blob objects, encode stored images for backup only.

export interface BackupImage {  
id: string;  
itemId?: string;  
collectionId?: string;  
fileName: string;  
mimeType: string;  
size: number;  
base64Data: string;  
createdAt: string;  
}

Base64 is acceptable inside downloaded backup files. It should not be used for normal database storage.

## **22.3 Backup validation**

Before import:

- Parse JSON safely
- Validate the format name
- Validate backup version
- Validate every entity with Zod
- Reject invalid files
- Show an import summary
- Require confirmation

## **22.4 Restore modes**

Offer:

### **Merge**

Keep current data and add imported data.

For ID conflicts:

- Preserve existing record by default
- Let user choose imported or existing version
- Never silently overwrite data

### **Replace everything**

Delete current data and restore backup.

Require typed confirmation:

REPLACE

## **22.5 Backup reminder**

Display a non-blocking reminder when:

- More than 30 days have passed since the last backup
- More than 20 changes have occurred since the last backup

Do not use notifications or a scheduled server.

---

# **23\. Optional Progressive Web App**

Configure the application as a PWA after the main CRUD system works.

Benefits:

- Installable on desktop or mobile
- App-like icon
- Static interface works offline
- Faster repeat loading

Use:

vite-plugin-pwa

Cache:

- Application shell
- Static JavaScript
- Static CSS
- Icons
- Fonts bundled with the application

Do not blindly cache third-party product pages or arbitrary product images.

The IndexedDB database remains available offline.

URL extraction requires internet access.

---

# **24\. Product extraction architecture**

A browser application cannot directly read arbitrary shopping pages because many sites enforce CORS restrictions.

Therefore, use a small Cloudflare Worker.

## **Worker responsibility**

The Worker must:

1. Receive a public HTTP or HTTPS URL.
2. Validate it.
3. Block internal network destinations.
4. Fetch HTML.
5. Parse structured metadata.
6. Return normalised JSON.
7. Discard the HTML.
8. Store no personal data.

The Worker must not maintain a database.

---

# **25\. Extraction endpoint**

## **Request**

POST /extract  
Content-Type: application/json

{  
"url": "https://example.com/product/item"  
}

## **Success response**

{  
"success": true,  
"data": {  
"requestedUrl": "https://example.com/product/item",  
"resolvedUrl": "https://example.com/product/item",  
"canonicalUrl": "https://example.com/product/item",  
"domain": "example.com",  
"storeName": "Example",  
"title": "Example Item",  
"brand": "Example Brand",  
"description": "Example description",  
"currentPrice": 24999,  
"originalPrice": 29999,  
"currency": "INR",  
"rating": 4.4,  
"reviewCount": 182,  
"availability": "in\_stock",  
"images": \[  
"https://example.com/image.jpg"  
\],  
"method": "json\_ld",  
"confidence": 0.9,  
"warnings": \[\]  
}  
}

## **Partial response**

{  
"success": true,  
"data": {  
"title": "Example Item",  
"images": \[  
"https://example.com/image.jpg"  
\],  
"method": "open\_graph",  
"confidence": 0.45,  
"warnings": \[  
"Price could not be detected.",  
"Rating could not be detected."  
\]  
}  
}

## **Failure response**

{  
"success": false,  
"error": {  
"code": "EXTRACTION\_FAILED",  
"message": "The page could not be read."  
},  
"manualEntryAllowed": true  
}

---

# **26\. Extraction order**

Use this order:

1. JSON-LD `Product`
2. Schema.org microdata
3. Open Graph product metadata
4. Standard metadata
5. Conservative DOM heuristics
6. Domain-specific adapters added later

## **JSON-LD fields**

Map:

name → title  
brand.name → brand  
description → description  
image → images  
offers.price → currentPrice  
offers.lowPrice → currentPrice  
offers.priceCurrency → currency  
offers.availability → availability  
aggregateRating.ratingValue → rating  
aggregateRating.reviewCount → reviewCount

Support:

- Object
- Array
- `@graph`
- Nested `Product`
- `Offer`
- `AggregateOffer`
- String or object brand
- String or array images

---

# **27\. Extraction limitations**

The application must explicitly communicate:

- Some websites block automated requests.
- Some prices appear only after JavaScript runs.
- Some websites require location or login.
- Some images reject external loading.
- Ratings may not be available.
- Extraction can be incorrect.
- The user must review all fields.

Do not claim universal compatibility.

Do not build a headless browser in the MVP.

Do not add Puppeteer or Playwright to the Worker.

Do not introduce paid scraping APIs.

---

# **28\. Worker security**

The extraction Worker creates an SSRF risk and must be treated as untrusted-input infrastructure.

## **Accept only**

http:  
https:

## **Reject**

- `localhost`
- IPv4 loopback
- IPv6 loopback
- Private network ranges
- Link-local ranges
- Cloud metadata addresses
- Internal domains
- Hostnames resolving to private addresses
- Non-HTML files
- Excessive redirects
- Excessive response size

## **Block at minimum**

127.0.0.0/8  
10.0.0.0/8  
172.16.0.0/12  
192.168.0.0/16  
169.254.0.0/16  
0.0.0.0  
::1  
fc00::/7  
fe80::/10

Also block common metadata targets such as:

169.254.169.254  
metadata.google.internal

Revalidate every redirect target.

## **Limits**

Maximum redirects: 3  
Maximum HTML response: 2 MB  
Fetch timeout: approximately 10 seconds  
Accepted content type: text/html

## **CORS**

Allow requests only from configured application origins.

Development may allow:

http://localhost:5173

Production must allow the deployed application origin.

Do not use unrestricted `Access-Control-Allow-Origin: *` unless the endpoint is deliberately public and strongly rate limited.

---

# **29\. Worker abuse controls**

A public extraction Worker can be abused.

Add:

- Maximum request-body size
- URL length limit
- Request timeout
- IP-based rate limiting when available
- Basic in-memory or platform rate limiting
- Origin checking
- No credentials forwarding
- No cookie forwarding
- No custom request headers from the client

The Worker must not send the user’s browser cookies to the target website.

---

# **30\. Duplicate detection**

Before saving a new item, compare:

1. Canonical URL
2. Normalised source URL
3. Source domain plus detected product identifier
4. Normalised title plus brand

URL normalisation should remove common tracking parameters:

utm\_source  
utm\_medium  
utm\_campaign  
utm\_term  
utm\_content  
gclid  
fbclid  
ref  
affiliate

Do not remove query parameters that may identify the actual product.

When a likely duplicate is found, show:

This item may already exist.

Actions:

- View existing item
- Save another copy
- Cancel

---

# **31\. Savings calculations**

export function calculateRemainingAmount(  
targetBudget?: number,  
amountSaved \= 0  
): number {  
if (\!targetBudget || targetBudget \<= 0\) {  
return 0;  
}

return Math.max(targetBudget \- amountSaved, 0);  
}

export function calculateSavingsPercentage(  
targetBudget?: number,  
amountSaved \= 0  
): number {  
if (\!targetBudget || targetBudget \<= 0\) {  
return 0;  
}

return Math.min(  
Math.max((amountSaved / targetBudget) \* 100, 0),  
100  
);  
}

Never automatically replace the target budget when a product’s online price changes.

---

# **32\. Price history**

## **Creation**

When an item is created with:

- Valid current price
- Valid currency

Create an initial price-history record.

## **Refresh**

When the user manually refreshes product details:

- Display the new information first
- Let the user approve the update
- Update current price only after approval
- Add a price-history record only when price or availability changed

Do not automatically refresh products in the MVP.

Scheduled price tracking introduces unnecessary backend complexity and can violate the zero-cost constraint.

---

# **33\. Design requirements**

## **Design direction**

The application should feel:

- Aspirational
- Personal
- Calm
- Modern
- Visual
- Clean
- Premium without fake luxury styling

Avoid:

- Excessive gradients
- Excessive animation
- Dense enterprise dashboards
- Neon colour schemes
- Confetti
- Childish gamification
- Massive hero sections inside the authenticated application

## **Desktop layout**

- Collapsible left sidebar
- Top search bar
- Main visual card grid
- Floating or visible Add Item action

## **Mobile layout**

- Compact header
- One-column card grid
- Bottom navigation or drawer
- Large touch targets
- Add button always accessible

---

# **34\. Accessibility**

Required:

- Semantic HTML
- Proper labels
- Keyboard navigation
- Visible focus indicators
- Accessible dialogs
- Escape-key dialog closing
- Screen-reader form errors
- Alt text
- Sufficient contrast
- Reduced-motion support
- Status not represented by colour alone

Icon-only buttons require `aria-label`.

---

# **35\. Error states**

## **Invalid URL**

Enter a complete link beginning with http:// or https://.

## **Extraction unavailable**

Automatic link reading is unavailable. You can still add the item manually.

## **Website blocked**

This website did not allow the page to be read. Enter the missing details manually.

## **Storage failure**

The item could not be saved in this browser. Export a backup and check available browser storage.

## **Invalid backup**

This file is not a valid AspireList backup.

## **Broken image**

Show a neutral placeholder and actions:

- Upload replacement
- Enter another image URL
- Remove image

Do not expose raw stack traces.

---

# **36\. Local-storage diagnostics**

Settings must include a Storage section.

Display:

- Number of items
- Number of stored images
- Approximate stored image size
- Last backup date
- Database version
- Export backup button
- Clear all data button

Where supported, display estimated browser-storage usage using:

navigator.storage.estimate()

Provide a button to request persistent storage:

navigator.storage.persist()

Do not claim persistence is guaranteed. The browser decides whether to grant it.

---

# **37\. Destructive actions**

## **Delete one item**

Require confirmation dialog.

## **Delete collection**

Explain that items are preserved.

## **Clear price history**

Require confirmation.

## **Delete all application data**

Require the user to type:

DELETE EVERYTHING

Before clearing all data, strongly expose the Export Backup button.

Do not prevent deletion after proper confirmation.

---

# **38\. Performance requirements**

The application should remain responsive with at least:

1,000 items

Requirements:

- Indexed queries
- Paginated dashboard
- Load 30–50 cards initially
- Lazy-load additional cards
- Debounced search
- Thumbnail-sized images
- No full price-history load on dashboard
- No complete database copy in React state
- Memoise expensive derived calculations
- Clean up Blob object URLs

---

# **39\. Testing requirements**

## **Unit tests**

Use Vitest.

Test:

- Item validation
- URL normalisation
- Price calculations
- Savings calculations
- Duplicate matching
- Backup validation
- Backup migration
- JSON-LD parsing
- Open Graph parsing
- Currency formatting
- Cascade deletion logic

## **Component tests**

Use React Testing Library.

Test:

- Item form
- Delete dialog
- Filter controls
- Empty state
- Backup import summary
- Broken image state

## **End-to-end tests**

Use Playwright locally after Lovable export.

Test:

1. Create an item manually.
2. View the item.
3. Edit the item.
4. Archive and restore the item.
5. Mark the item purchased.
6. Delete the item.
7. Create and delete a category.
8. Create and delete a collection.
9. Export a backup.
10. Clear the database.
11. Restore the backup.
12. Attempt a failed extraction.
13. Complete manual fallback.
14. Verify data remains after page reload.

---

# **40\. Deployment**

## **Frontend deployment**

Deploy the static Vite application to Vercel.

Build command:

npm run build

Output directory:

dist

Add `vercel.json`:

{  
"$schema": "https://openapi.vercel.sh/vercel.json",  
"rewrites": \[  
{  
"source": "/(.\*)",  
"destination": "/index.html"  
}  
\]  
}

This prevents direct route navigation from returning a 404\.

## **Environment variables**

Frontend:

VITE\_EXTRACTION\_WORKER\_URL

No secret is needed in the frontend.

The Worker URL is public configuration, not a secret.

## **Worker deployment**

Deploy separately using Cloudflare Wrangler.

The Worker may use environment configuration for:

ALLOWED\_ORIGINS  
MAX\_RESPONSE\_BYTES  
FETCH\_TIMEOUT\_MS

Do not commit account tokens.

---

# **41\. Local development**

git clone \<repository-url\>  
cd \<repository-directory\>  
npm install  
cp .env.example .env.local  
npm run dev

Required scripts:

{  
"scripts": {  
"dev": "vite",  
"build": "tsc \-b && vite build",  
"preview": "vite preview",  
"lint": "eslint .",  
"typecheck": "tsc \--noEmit",  
"test": "vitest run",  
"test:watch": "vitest",  
"test:e2e": "playwright test"  
}  
}

Before deployment:

npm run lint  
npm run typecheck  
npm run test  
npm run build

---

# **42\. Lovable token-minimisation strategy**

Lovable must not be asked to create the entire system in one prompt.

That produces broken code and wastes credits.

Use these rules:

1. Put this entire document into Project Knowledge.
2. Use one implementation prompt per phase.
3. Tell Lovable not to modify unrelated files.
4. Tell Lovable to inspect existing code before generating.
5. Do not repeatedly request visual redesigns.
6. Complete data architecture before polishing.
7. Export to GitHub early.
8. Use Codex locally after the core Lovable build.
9. Do not ask Lovable to run broad audits after every phase.
10. Create a Git commit after every working phase.

---

# **43\. Implementation phases**

## **Phase 1: Static application shell**

Build:

- Routes
- Sidebar
- Mobile navigation
- Dashboard shell
- Theme support
- Empty states
- Not-found page

Do not build extraction.

## **Phase 2: IndexedDB foundation**

Build:

- Dexie database
- TypeScript models
- Repository layer
- Seed categories
- Settings
- Reactive queries

## **Phase 3: Manual item CRUD**

Build:

- Create
- Read
- Update
- Delete
- Archive
- Restore
- Purchased state
- Rejected state

## **Phase 4: Categories and collections CRUD**

Build:

- Category management
- Collection management
- Many-to-many item relations
- Safe collection deletion

## **Phase 5: Search and dashboard**

Build:

- Search
- Filters
- Sorting
- Summary metrics
- Grid and list views
- Pagination

## **Phase 6: Image storage**

Build:

- File upload
- Client-side resize
- Blob storage
- Broken image fallback
- Image replacement
- Image deletion

## **Phase 7: Backup and restore**

Build:

- JSON export
- JSON import
- CSV export
- Merge mode
- Replace mode
- Backup validation
- Backup reminder

## **Phase 8: Extraction Worker**

Build:

- Cloudflare Worker
- SSRF protection
- Metadata parsing
- Normalised result
- Error handling

## **Phase 9: Extraction interface**

Build:

- Paste URL
- Loading state
- Preview
- Manual correction
- Duplicate warning
- Save

## **Phase 10: Testing and hardening**

Build:

- Unit tests
- Component tests
- End-to-end tests
- Accessibility fixes
- Production build fixes
- Deployment configuration

---

# **44\. Lovable Prompt 1 — Application shell**

Read the complete AspireList specification from Project Knowledge.

Implement Phase 1 only.

Create a React, TypeScript and Vite application using:  
\- React Router  
\- Tailwind CSS  
\- shadcn/ui  
\- Lucide React

Create these routes:  
\- /dashboard  
\- /items/new  
\- /items/:itemId  
\- /items/:itemId/edit  
\- /collections  
\- /collections/:collectionId  
\- /categories  
\- /purchased  
\- /archived  
\- /backup  
\- /settings  
\- wildcard not-found route

Build:  
\- Responsive desktop sidebar  
\- Responsive mobile navigation  
\- Dashboard shell  
\- Page headers  
\- Empty states  
\- Light, dark and system theme support  
\- Accessible buttons and dialogs  
\- Consistent loading skeletons

Do not add:  
\- Authentication  
\- Supabase  
\- Firebase  
\- Any remote database  
\- Any backend  
\- URL extraction  
\- Mock API calls

Use temporary static placeholders only where data components will later appear.

Do not modify unrelated configuration.  
Run TypeScript checks and fix all errors before completing.

---

# **45\. Lovable Prompt 2 — IndexedDB architecture**

Read Phase 2 and the database models in Project Knowledge.

Implement IndexedDB persistence using Dexie.js.

Create:  
\- AspireListDatabase  
\- Version 1 schema  
\- TypeScript domain models  
\- Repository layer  
\- Error types  
\- ID generation helpers  
\- Timestamp helpers  
\- App settings record  
\- Default categories

Tables:  
\- items  
\- categories  
\- collections  
\- itemCollections  
\- priceHistory  
\- images  
\- settings

Follow the exact indexes and relationships in Project Knowledge.

Requirements:  
\- Database is the source of truth.  
\- Do not copy all database data into global React context.  
\- Use Dexie transactions for multi-table changes.  
\- Create clean repository functions.  
\- Do not implement UI forms yet.  
\- Do not add a server or remote database.  
\- Do not remove existing routes or layout.

Add unit tests for database creation and basic repository operations.  
Run type checking and tests.

---

# **46\. Lovable Prompt 3 — Full item CRUD**

Implement Phase 3 of AspireList.

Build complete item CRUD using the existing Dexie repository layer.

Create:  
\- Manual add-item page  
\- Item details page  
\- Edit-item page  
\- Dashboard item cards  
\- Grid view  
\- List view  
\- Delete confirmation dialog  
\- Archive action  
\- Restore action  
\- Mark-as-purchased flow  
\- Purchased page  
\- Rejected state  
\- Archived page

Use:  
\- React Hook Form  
\- Zod  
\- Accessible shadcn/ui forms  
\- The exact WishlistItem model from Project Knowledge

Rules:  
\- Title, priority and status are required.  
\- Every editable field must be editable after creation.  
\- Update updatedAt on every change.  
\- Deleting an item must transactionally delete its collection relations, price history and local images.  
\- Purchased items are preserved unless manually deleted.  
\- Manual entry must work without internet.  
\- Do not implement URL extraction.  
\- Do not add authentication.  
\- Do not add Supabase or another backend.

Test create, read, update, archive, restore, purchase and delete flows.  
Do not redesign the existing layout.

---

# **47\. Lovable Prompt 4 — Category and collection CRUD**

Implement Phase 4 from Project Knowledge.

Build complete category CRUD and collection CRUD.

Categories:  
\- Create  
\- Read  
\- Rename  
\- Change icon  
\- Reorder  
\- Delete

Collections:  
\- Create  
\- Read  
\- Edit  
\- Reorder  
\- Delete  
\- Add item  
\- Remove item  
\- Show all collection items

Rules:  
\- An item may belong to multiple collections.  
\- Prevent duplicate item-to-collection relations.  
\- Deleting a category must preserve items and clear categoryId.  
\- Deleting a collection must preserve items and delete only its relations and cover image.  
\- Use Dexie transactions for destructive operations.  
\- Add confirmation dialogs.  
\- Do not add a backend.

Add tests for deletion behaviour and many-to-many relations.

---

# **48\. Lovable Prompt 5 — Search and dashboard**

Implement Phase 5\.

Build:  
\- Dashboard summary metrics  
\- Debounced search  
\- Status filter  
\- Priority filter  
\- Category filter  
\- Collection filter  
\- Store filter  
\- Currency filter  
\- Price range filter  
\- Date-added filter  
\- Sorting  
\- Grid/list toggle  
\- Pagination or incremental loading

Search:  
\- title  
\- brand  
\- store  
\- description  
\- personal notes  
\- reason for wanting

Rules:  
\- Group monetary totals by currency.  
\- Never add different currencies.  
\- Persist display preference in settings.  
\- Keep filters efficient for at least 1,000 items.  
\- Do not load full price history on the dashboard.  
\- Do not introduce Redux or another state library.

---

# **49\. Lovable Prompt 6 — Image handling**

Implement Phase 6\.

Add local image support using the existing IndexedDB images table.

Support:  
\- Image file upload  
\- Image preview  
\- Client-side resizing  
\- Compression  
\- Blob storage  
\- Remote image URL  
\- Broken-image fallback  
\- Image replacement  
\- Image deletion

Rules:  
\- Do not store Base64 in normal item records.  
\- Store uploaded files as Blob objects.  
\- Reject unsupported MIME types.  
\- Limit image dimensions to approximately 1600 by 1600\.  
\- Aim for files under 1 MB where practical.  
\- Clean up every URL.createObjectURL result with URL.revokeObjectURL.  
\- Deleting an item must delete its images.  
\- Do not add cloud image storage.

---

# **50\. Lovable Prompt 7 — Backup and restore**

Implement Phase 7 exactly as defined in Project Knowledge.

Build:  
\- Full JSON backup  
\- JSON restore  
\- CSV item export  
\- Backup file validation  
\- Backup version field  
\- Merge restore mode  
\- Replace-all restore mode  
\- Import summary  
\- Conflict handling  
\- Backup reminder  
\- Last backup date  
\- Storage diagnostics  
\- Clear-all-data workflow

Images:  
\- Convert Blobs to Base64 only in exported backup files.  
\- Convert Base64 back to Blobs during restore.

Security and safety:  
\- Validate the entire backup with Zod.  
\- Invalid backups must make no database changes.  
\- Use a Dexie transaction for restore.  
\- Replace-all requires typing REPLACE.  
\- Clear-all requires typing DELETE EVERYTHING.  
\- Expose Export Backup before destructive operations.

Add tests for export and complete restoration.

---

# **51\. Lovable Prompt 8 — Product extraction interface only**

Build the frontend product extraction workflow, but do not build or assume a paid API.

Use the VITE\_EXTRACTION\_WORKER\_URL environment variable.

Build:  
\- URL input  
\- URL validation  
\- Loading state  
\- Timeout handling  
\- Success state  
\- Partial-success warnings  
\- Failure state  
\- Editable result preview  
\- Retry  
\- Manual fallback  
\- Duplicate detection  
\- Save after explicit confirmation

Rules:  
\- Manual creation must remain equally visible.  
\- Extraction failure must never block saving.  
\- Every extracted field must be editable.  
\- Do not automatically save extracted information.  
\- Do not expose technical confidence decimals.  
\- Do not add Supabase, Firebase or an external scraping service.  
\- The application must still build when the Worker URL is missing.

---

# **52\. Lovable Prompt 9 — Final frontend audit**

Audit the complete AspireList frontend.

Do not add new features.

Check and fix:  
\- TypeScript errors  
\- Broken routes  
\- IndexedDB transaction failures  
\- CRUD failures  
\- Cascade deletion  
\- Backup and restore  
\- Image Blob leaks  
\- Missing validation  
\- Broken-image states  
\- Empty states  
\- Loading states  
\- Mobile layout  
\- Keyboard navigation  
\- Dialog accessibility  
\- Colour contrast  
\- Incorrect currency totals  
\- Console errors  
\- Unhandled promises  
\- Production build failures

Verify the application works without:  
\- Internet access, except URL extraction  
\- Supabase  
\- Authentication  
\- A database server  
\- An extraction Worker

Provide a final list of:  
\- Files changed  
\- Known limitations  
\- Tests completed  
\- Remaining manual checks

---

# **53\. Codex prompt — Cloudflare extraction Worker**

Do this locally after exporting the frontend from Lovable.

Create a Cloudflare Worker inside the /worker directory for AspireList.

Objective:  
Accept a public product URL and return normalised public product metadata.

Requirements:  
1\. POST /extract endpoint.  
2\. Accept JSON containing a URL.  
3\. Support only HTTP and HTTPS.  
4\. Reject localhost, loopback, private IP ranges, link-local ranges, internal hostnames and cloud metadata targets.  
5\. Resolve and validate destination addresses.  
6\. Revalidate every redirect.  
7\. Limit redirects to three.  
8\. Limit response HTML to 2 MB.  
9\. Use approximately a 10-second timeout.  
10\. Require text/html.  
11\. Do not forward browser cookies or credentials.  
12\. Do not execute remote JavaScript.  
13\. Do not return raw HTML.  
14\. Add configurable allowed CORS origins.  
15\. Add conservative abuse controls.  
16\. Parse JSON-LD Product data.  
17\. Parse Open Graph metadata.  
18\. Parse standard metadata.  
19\. Normalise URLs, prices, currencies, ratings and availability.  
20\. Return success, partial success and safe failure responses.  
21\. Store no user or product data.  
22\. Add Vitest unit tests.  
23\. Add SSRF test cases.  
24\. Add redirect-to-private-address test cases.  
25\. Do not use paid APIs or browser automation.

Do not change the React application except for documented integration types if required.

---

# **54\. Production acceptance criteria**

The application is complete only when:

## **Core**

- It runs without a backend.
- It works after page refresh.
- It works offline except for extraction.
- No user data is sent to a database service.
- No paid API is required.

## **Item CRUD**

- Create works.
- Read works.
- Update works.
- Delete works.
- Related records are safely deleted.
- Purchased items can be preserved.
- Fulfilled items can be permanently deleted.

## **Category CRUD**

- Create works.
- Read works.
- Update works.
- Delete works.
- Deleting a category preserves items.

## **Collection CRUD**

- Create works.
- Read works.
- Update works.
- Delete works.
- Deleting a collection preserves items.

## **Backup**

- Full export works.
- Full restore works.
- Images survive export and restore.
- Invalid files cause no database changes.
- Merge mode works.
- Replace mode works.

## **Extraction**

- Manual entry works without extraction.
- Worker URL is optional.
- Partial extraction can be corrected.
- Failed extraction can be ignored.
- Unsafe URLs are rejected.

## **Deployment**

- Production build succeeds.
- Direct route navigation works.
- Vercel deployment works.
- No secret appears in frontend code.
- Local clone can run using documented commands.

---

# **55\. Known limitations**

The local-first version intentionally has these limitations:

- Data is tied to the browser and device until exported.
- Clearing browser storage can delete data.
- There is no automatic device synchronisation.
- There is no account login.
- There is no password recovery.
- There is no server-side backup.
- Link extraction will not work on every store.
- Scheduled price tracking is excluded.
- Remote image URLs may break.
- Browser-storage capacity varies by device.
- Private browsing may not preserve data.

These limitations are acceptable because the application avoids recurring storage and backend costs.

---

# **56\. Future migration path**

Only add cloud synchronisation after it becomes genuinely necessary.

The architecture must keep repositories separate from UI components so that IndexedDB can later be replaced or supplemented.

Possible future modes:

Local-only  
Local plus manual backup  
Local plus self-hosted sync  
Local plus Supabase free tier  
Local plus another database

Do not build these modes now.

The domain models and backup format must remain platform-independent.

---

# **57\. Final engineering rule**

AspireList must remain useful when every external service is removed.

The essential application is:

Static React interface  
\+ IndexedDB  
\+ complete CRUD  
\+ image storage  
\+ backup and restore

URL extraction is a convenience layer.

Cloud hosting is a delivery layer.

Neither is the permanent owner of the user’s data.

You were right. The earlier file was inadequate.

I created a substantially expanded **Lovable-ready master specification** containing over **10,000 words and 3,800 lines**.

Download AspireList Deep Master Specification

It includes:

- Complete product requirements
- Free local-first architecture
- Exact technology stack
- IndexedDB and Dexie schema
- Full TypeScript data models
- Repository contracts
- Complete item CRUD
- Category and collection CRUD
- Transaction and deletion rules
- Every route and page
- Detailed UI behaviour
- Search, filters, sorting and pagination
- Image upload and Blob storage
- Price and savings calculations
- Price history
- Duplicate detection
- Optional free URL-extraction architecture
- JSON backup and restoration
- CSV export
- Merge and replace restore modes
- Validation schemas
- Error, loading and empty states
- Accessibility requirements
- Responsive behaviour
- PWA requirements
- Security requirements
- Testing strategy
- Vercel deployment configuration
- Ten separate Lovable implementation prompts
- Codex prompt for the Cloudflare extraction Worker
- Acceptance criteria
- Definition of done
- Future migration path

Upload the file to **Lovable Project Knowledge**. Then use the numbered Lovable phase prompts from the document individually, starting with **Phase 1**. Do not ask Lovable to implement all ten phases in one message.
