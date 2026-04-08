import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANG_KEY = 'user_lang';
  currentLang = signal<'en' | 'ar'>('en');

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem(this.LANG_KEY) as 'en' | 'ar';
    const defaultLang = savedLang || 'en';
    
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    this.setLanguage(defaultLang);
  }

  setLanguage(lang: 'en' | 'ar') {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem(this.LANG_KEY, lang);
    this.updateDirection(lang);
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  private updateDirection(lang: 'en' | 'ar') {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}
