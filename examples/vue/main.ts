import { createApp, h, ref, defineComponent } from 'vue';
import { Glass, Switch, Segmented, Slider, Menu, vGlass } from '../../src/vue';

const App = defineComponent({
  directives: { glass: vGlass },
  setup() {
    const on = ref(true), period = ref('Week'), vol = ref(40), picked = ref('');
    return () => h('div', { style: 'display:grid;gap:20px;padding:30px;background:linear-gradient(135deg,#22d3ee,#a855f7);min-height:100vh;align-content:start' }, [
      h(Glass, { variant: 'regular', style: 'padding:20px;border-radius:28px;display:flex;gap:16px;align-items:center' }, () => [
        h(Switch, { modelValue: on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v) }),
        h(Segmented, { options: ['Day', 'Week', 'Month'], modelValue: period.value, 'onUpdate:modelValue': (v: string) => (period.value = v) }),
        h(Slider, { modelValue: vol.value, 'onUpdate:modelValue': (v: number) => (vol.value = v), style: 'width:200px' }),
      ]),
      h(Menu, { items: [{ label: 'Copy', icon: 'copy' }, { label: 'Delete', icon: 'trash', destructive: true }], onSelect: (v: string) => (picked.value = v) }),
      h('pre', { id: 'state', style: 'color:#fff' }, JSON.stringify({ on: on.value, period: period.value, vol: Math.round(vol.value), picked: picked.value })),
    ]);
  },
});
createApp(App).mount('#root');
