# Branta Films

আমরা একটি প্রিমিয়াম স্ট্রিমিং প্ল্যাটফর্ম তৈরি করতে চাই যার নাম 'Branta Films' (কাস্টম ডোমেইন: films.brantatech.com)। 

১. ব্র্যান্ডিং ও ডিজাইন সিস্টেম:
- সম্পূর্ণ @project:eac1e95a-2df4-40db-8f85-efa3f365b33f:"brantatech-com" এর ডার্ক থিম, কালার প্যালেট (#0B0B0B ব্যাকগ্রাউন্ড, #161616 সারফেস, #FF5D00 Branta Orange অ্যাকসেন্ট), লোগো, ফেভিকন এবং টাইপোগ্রাফি অনুযায়ী হবে।
- বাংলা ফন্ট হিসেবে 'SolaimanLipi' (ফলব্যাক Kalpurush, sans-serif) এবং ইংরেজি ও সংখ্যার জন্য 'Geist' ও 'Geist Mono' ব্যবহার করতে হবে।

২. সিকিউরিটি ও ব্রাউজার শিল্ড:
- @project:0b934a6f-9f9d-47f8-b76c-960a68b43f5a:"Branta Hub" এ যেভাবে DevToolsShield দিয়ে Right-Click, F12, Ctrl+Shift+I/J/C, Cmd+Option+I, Ctrl+U, Ctrl+S সম্পূর্ণ ব্লক করা আছে এবং ডিবাগার টাইমিং লুপ দিয়ে কনসোল ডিটেক্ট করে ব্ল্যাকআউট ওয়ার্নিং দেওয়া হয়েছে সেইম আর্কিটেকচার থাকবে। ডেভেলপমেন্ট/লোকালহোস্ট ও প্রিভিউ ডোমেইনে এটি ডিজেবল থাকবে কিন্তু প্রোডাকশনে সক্রিয় হবে।

৩. ভিডিও স্টোরেজ ও প্লেব্যাক (Cloudflare R2):
- ভিডিও সংরক্ষিত থাকবে প্রাইভেট Cloudflare R2 বাকেটে (branta-films)। বাকেটের কোনো পাবলিক URL থাকবে না।
- ইউজার ভিডিও প্লে করার সময় সার্ভার-সাইড (Supabase) থেকে টাইম-লিমিটেড Pre-signed URL জেনারেট করে প্লেয়ারে প্রোভাইড করতে হবে। ফ্রি এপিসোড লগড-ইন যেকেউ দেখতে পারবে, আর পেইড এপিসোড শুধুমাত্র যাদের সিরিজ আনলক করা আছে ডাটাবেস ভেরিফিকেশন শেষে তারাই লিংক পাবে। Inspect Element বা Network Tab ঘেঁটে কেউ ডিরেক্ট সোর্স পাবে না।
- ভিডিও প্লেয়ারে Vimeo/Custom Video Player SDK ব্যবহার হবে এবং ইউজারের ওয়াচ প্রগ্রেস (Continue Watching) প্রতি ১০-১৫ সেকেন্ডে এবং পজ করার সময় ডাটাবেসে সেভ হবে।
- অ্যাডমিন প্যানেল থেকে যেকোনো সাইজের বড় ভিডিও আপলোডের জন্য Direct-to-R2 Presigned Multipart Upload আর্কিটেকচার থাকবে লাইভ আপলোড প্রগ্রেস বার সহ।

৪. অথেন্টিকেশন ও এক্সেস কন্ট্রোল:
- সাধারণ ইউজার: Google OAuth, Email OTP (6-digit, 600s expiry), Email + Password, এবং Passkey (WebAuthn @simplewebauthn) লগইন।
- ম্যানুয়াল অ্যাকাউন্ট লিঙ্কিং সক্রিয়: ইমেইল/পাসওয়ার্ডে খোলা অ্যাকাউন্টে পরবর্তীতে একই ইমেইলে গুগল লগইন করলেও একই অ্যাকাউন্টে মার্জ হবে।
- ইনপুট বক্সে @project:92cdac08-5a8f-43a4-af29-da13a2aba9b7:"Upoharkabbo" এর মতো ভ্যালিডেশন, Caps Lock ইন্ডিকেটর, ল্যাঙ্গুয়েজ ইন্ডিকেটর ও ভিউ পাসওয়ার্ড টগল থাকবে। পাসওয়ার্ড চেঞ্জে কারেন্ট পাসওয়ার্ড বাধ্যতামূলক এবং নতুন পাসওয়ার্ড আগের বা কারেন্ট পাসওয়ার্ডের সমান হওয়া যাবে না।
- অ্যাডমিন/ম্যানেজাররা সাইন আপ করে অ্যাকাউন্ট খুলতে পারবে না। @project:92cdac08-5a8f-43a4-af29-da13a2aba9b7:"Upoharkabbo" এর মতো অ্যাডমিন প্যানেলের Staff/Manager সেকশন থেকে ইনভাইট/ক্রিয়েট করতে হবে।

৫. ড্যাশবোর্ড UI/UX ও লেআউট:
- ইউজার ও অ্যাডমিন ড্যাশবোর্ড @project:a62639b1-d330-4159-b56e-25451a9889c4:"Panjabi Shop BD" এর মতো স্বাধীন সাইডবার ও নো-লেআউট-শিফট স্ট্রাকচারে হবে কিন্তু ব্র্যান্ডিং Branta Tech এর মতো।
- নো পপআপ পলিসি: সিরিজ এবং এপিসোড ক্রিয়েট ও এডিট সবসময় ফুল পেজে ওপেন হবে।
- ডেসক্রিপশন ও টেক্সটের জন্য MS Word / Google Docs স্টাইল সম্পূর্ণ Rich Text Editor (RTE) থাকবে (Font size, bold, italic, color, alignment, bullet points ইত্যাদি) যা মেইন সাইটে হুবহু রেন্ডার হবে।
- UX রুলস: পপআপ মডালের বাইরে ক্লিক করলে ক্লোজ হবে না (শুধু ক্রস [X] বাটনে ক্লোজ হবে), ব্রাউজারের নেটিভ কনফার্মেশন ডায়ালগ বাদ দিয়ে কাস্টম ব্র্যান্ডেড ডায়ালগ হবে, এবং ফর্মে সত্যিকারের কোনো পরিবর্তন ছাড়া Save বাটন ডিসেবল থাকবে।

৬. ইউজার ও এমপ্লয়ী ম্যানেজমেন্ট:
- অ্যাডমিন প্যানেলে @project:0b934a6f-9f9d-47f8-b76c-960a68b43f5a:"Branta Hub" এর মতো ইমপ্লয়ী/ম্যানেজার এবং সাইনড ইন ইউজারদের লিস্ট, ডিটেইলড অ্যাক্টিভিটি হিস্ট্রি এবং One-click Impersonation থাকবে। ইমপারসোনেট চলাকালে টপে অ্যাম্বার কালার ব্যানার থাকবে যেখান থেকে আবার অ্যাডমিন সেশনে এক্সিট করা যাবে।

৭. পেমেন্ট সিস্টেম:
- Phase 1: বিকাশ ও নগদ ম্যানুয়াল পেমেন্ট (ইউজার TrxID ও ফোন নাম্বার সাবমিট করবে, অ্যাডমিন প্যানেলে ভেরিফাই করে Approve করলেই সিরিজ আনলক হবে)। ইউনিক TrxID ভ্যালিডেশন থাকবে।
- Phase 2: অটোমেটেড গেটওয়ে রেডি আর্কিটেকচার (Webhook & Edge Function ভেরিফিকেশন)।

৮. লিগ্যাল কমপ্লায়েন্স:
- ফুটারে Branta Tech এর অফিসিয়াল রুলস অনুযায়ী কাস্টম Privacy Policy ও Terms of Service পেজ।

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://branta-films.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1818751d-1da6-44f9-83b0-f9dc87d66c56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
