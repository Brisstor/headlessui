import {
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  unref,

  // Types
  ComputedRef,
  InjectionKey,
  Ref,
} from 'vue'

import { useId } from '../../hooks/use-id'
import { render } from '../../utils/render'

// ---

let DescriptionContext = Symbol('DescriptionContext') as InjectionKey<{
  register(value: string): () => void
  slot: Ref<Record<string, any>>
  name: string
  props: Record<string, any>
}>

function useDescriptionContext() {
  let context = inject(DescriptionContext, null)
  if (context === null) {
    throw new Error('Missing parent')
  }
  return context
}

export function useDescriptions({
  slot = ref({}),
  name = 'Description',
  props = {},
}: {
  slot?: Ref<Record<string, unknown>>
  name?: string
  props?: Record<string, unknown>
} = {}): ComputedRef<string | undefined> {
  let descriptionIds = ref<string[]>([])

  function register(value: string) {
    descriptionIds.value.push(value)

    return () => {
      let idx = descriptionIds.value.indexOf(value)
      if (idx === -1) return
      descriptionIds.value.splice(idx, 1)
    }
  }

  provide(DescriptionContext, { register, slot, name, props })

  // The actual id's as string or undefined.
  return computed(() =>
    descriptionIds.value.length > 0 ? descriptionIds.value.join(' ') : undefined
  )
}

// ---

export let Description = defineComponent({
  compatConfig: {
    RENDER_FUNCTION: false,
    INSTANCE_ATTRS_CLASS_STYLE: false,
  },
  name: 'Description',
  props: {
    as: { type: [Object, String], default: 'p' },
  },
  render() {
    let { name = 'Description', slot = ref({}), props = {} } = this.context
    let passThroughProps = this.$props
    let propsWeControl = {
      ...Object.entries(props).reduce(
        (acc, [key, value]) => Object.assign(acc, { [key]: unref(value) }),
        {}
      ),
      id: this.id,
    }

    return render({
      props: { ...passThroughProps, ...propsWeControl },
      slot: slot.value,
      attrs: this.$attrs,
      slots: this.$slots,
      name,
    })
  },
  setup() {
    let context = useDescriptionContext()
    let id = `headlessui-description-${useId()}`

    onMounted(() => onUnmounted(context.register(id)))

    return { id, context }
  },
})
