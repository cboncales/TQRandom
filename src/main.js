import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import AOS from "aos";
import "aos/dist/aos.css";
import { useThemeStore } from "./stores/themeStore";

// Initialize AOS
AOS.init();

// Create Pinia instance
const pinia = createPinia();

// Create app
const app = createApp(App);

// Use plugins
app.use(pinia);
app.use(router);

// Initialize theme BEFORE mounting the app
const themeStore = useThemeStore();
themeStore.initTheme();

// Mount app
app.mount("#app");