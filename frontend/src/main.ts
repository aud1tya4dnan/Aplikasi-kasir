import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Oh Vue Icons
import { OhVueIcon, addIcons } from 'oh-vue-icons'
import {
    BiPerson,
    BiBoxSeam,
    BiCart,
    BiPeople,
    BiGraphUp,
    BiGear,
    BiCash,
    BiCreditCard,
    BiQrCodeScan,
    BiPlus,
    BiPencil,
    BiTrash,
    BiSearch,
    BiX,
    BiCheck,
    BiExclamationTriangle,
    BiHouseDoor,
    BiReceipt,
    BiTruck,
    BiWallet,
    BiChevronDown,
    BiList,
    BiGrid,
} from 'oh-vue-icons/icons'

addIcons(
    BiPerson,
    BiBoxSeam,
    BiCart,
    BiPeople,
    BiGraphUp,
    BiGear,
    BiCash,
    BiCreditCard,
    BiQrCodeScan,
    BiPlus,
    BiPencil,
    BiTrash,
    BiSearch,
    BiX,
    BiCheck,
    BiExclamationTriangle,
    BiHouseDoor,
    BiReceipt,
    BiTruck,
    BiWallet,
    BiChevronDown,
    BiList,
    BiGrid,
)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.component('v-icon', OhVueIcon)

app.mount('#app')
