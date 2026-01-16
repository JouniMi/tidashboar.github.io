class ThemeService {
    constructor() {
        this.STORAGE_KEY = 'ti-dashboard-theme';
        this.THEME = {
            LIGHT: 'light',
            DARK: 'dark'
        };
        
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme && (savedTheme === this.THEME.LIGHT || savedTheme === this.THEME.DARK)) {
            return savedTheme;
        }
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? this.THEME.DARK : this.THEME.LIGHT;
    }
    
    saveTheme(theme) {
        localStorage.setItem(this.STORAGE_KEY, theme);
    }
    
    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.toggle('dark-theme', theme === this.THEME.DARK);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === this.THEME.LIGHT ? this.THEME.DARK : this.THEME.LIGHT;
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
        return newTheme;
    }
    
    getTheme() {
        return this.currentTheme;
    }
    
    isDarkTheme() {
        return this.currentTheme === this.THEME.DARK;
    }
    
    setTheme(theme) {
        if (theme !== this.THEME.LIGHT && theme !== this.THEME.DARK) {
            console.warn('Invalid theme:', theme);
            return;
        }
        this.applyTheme(theme);
        this.saveTheme(theme);
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.applyTheme(e.matches ? this.THEME.DARK : this.THEME.LIGHT);
            }
        });
    }
}

window.themeService = new ThemeService();
