
# 🌙 Tushlar Tabiri — Deploy Guide

Ushbu loyihani bepul hostingga joylashtirish juda oson.

## 🚀 Qadam-baqadam ko'rsatma:

1. **GitHub-ga yuklash:**
   - Ushbu kodlarni o'z kompyuteringizga oling va GitHub-da yangi repozitoriy ochib yuklang.

2. **Vercel orqali joylash (Eng oson yo'li):**
   - [Vercel.com](https://vercel.com) saytiga kiring.
   - GitHub profilingiz bilan kiring.
   - **"Add New"** -> **"Project"** tugmasini bosing.
   - Yuklangan repozitoriyni tanlang.
   - **"Environment Variables"** bo'limiga o'ting:
     - Key: `API_KEY`
     - Value: `Sizning_Google_Gemini_API_Kalitingiz`
   - **"Deploy"** tugmasini bosing.

3. **Tayyor!**
   - Vercel sizga bepul `.vercel.app` domenini beradi (masalan: `tushlar-tabiri.vercel.app`).

## 🛠 Texnologiyalar:
- **Frontend:** React, Tailwind CSS
- **AI:** Google Gemini API
- **Background:** Tokyo Night Aesthetic
- **PWA:** Offline ishlash va mobil ilova sifatida o'rnatish imkoniyati.
