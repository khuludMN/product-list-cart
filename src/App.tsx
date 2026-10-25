import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import data from '../data.json'

/* ---------- Types ---------- */
interface Dessert {
  name: string
  category: string
  price: number
  image: { thumbnail: string; mobile: string; tablet: string; desktop: string }
}
interface CartItem { dessert: Dessert; quantity: number }
interface State { items: CartItem[]; confirmed: boolean }

type Action =
  | { type: 'ADD'; dessert: Dessert }
  | { type: 'INCREMENT'; name: string }
  | { type: 'DECREMENT'; name: string }
  | { type: 'REMOVE'; name: string }
  | { type: 'CONFIRM' }
  | { type: 'RESET' }

/* ---------- Reducer ---------- */
const initialState: State = { items: [], confirmed: false }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      if (state.items.some(i => i.dessert.name === action.dessert.name)) return state
      return { ...state, items: [...state.items, { dessert: action.dessert, quantity: 1 }] }
    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map(i =>
          i.dessert.name === action.name ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map(i => (i.dessert.name === action.name ? { ...i, quantity: i.quantity - 1 } : i))
          .filter(i => i.quantity > 0),
      }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.dessert.name !== action.name) }
    case 'CONFIRM':
      return { ...state, confirmed: true }
    case 'RESET':
      return initialState
  }
}

/* ---------- Context ---------- */
interface CartContextValue {
  state: State
  dispatch: Dispatch<Action>
  totalItems: number
  totalPrice: number
}
const CartContext = createContext<CartContextValue | null>(null)

function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = state.items.reduce((s, i) => s + i.quantity * i.dessert.price, 0)
  return (
    <CartContext.Provider value={{ state, dispatch, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

/* ---------- Helpers ---------- */
const desserts = data as Dessert[]
const asset = (path: string) => path.replace(/^\./, '') // "./assets/images/x.jpg" -> "/assets/images/x.jpg"
const money = (n: number) => `$${n.toFixed(2)}`
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red'

/* ---------- Dessert card ---------- */
function DessertCard({ dessert }: { dessert: Dessert }) {
  const { state, dispatch } = useCart()
  const item = state.items.find(i => i.dessert.name === dessert.name)
  const { image } = dessert

  return (
    <li>
      <div className="relative">
        <picture>
          <source media="(min-width: 1024px)" srcSet={asset(image.desktop)} />
          <source media="(min-width: 640px)" srcSet={asset(image.tablet)} />
          <img
            src={asset(image.mobile)}
            alt={dessert.name}
            className={`block w-full rounded-lg border-2 ${item ? 'border-red' : 'border-transparent'}`}
          />
        </picture>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          {item ? (
            <div className="flex h-11 w-40 items-center justify-between rounded-full bg-red px-3 text-sm font-semibold text-white">
              <button
                aria-label={`Decrease ${dessert.name} quantity`}
                onClick={() => dispatch({ type: 'DECREMENT', name: dessert.name })}
                className={`grid size-5 cursor-pointer place-items-center rounded-full border border-white hover:bg-white hover:text-red ${focus}`}
              ><svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 1h10" />
                </svg>
              </button>
              <span aria-live="polite">{item.quantity}</span>
              <button
                aria-label={`Increase ${dessert.name} quantity`}
                onClick={() => dispatch({ type: 'INCREMENT', name: dessert.name })}
                className={`grid size-5 cursor-pointer place-items-center rounded-full border border-white hover:bg-white hover:text-red ${focus}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h10M5 0v10" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => dispatch({ type: 'ADD', dessert })}
              className={`flex h-11 w-40 cursor-pointer items-center justify-center gap-2 rounded-full border border-rose-400 bg-white text-sm font-semibold hover:border-red hover:text-red ${focus}`}
            >
              <img src="/assets/images/icon-add-to-cart.svg" alt="" />
              Add to Cart
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm text-rose-500">{dessert.category}</p>
        <h2 className="font-semibold">{dessert.name}</h2>
        <p className="font-semibold text-red">{money(dessert.price)}</p>
      </div>
    </li>
  )
}

/* ---------- Cart ---------- */
function Cart() {
  const { state, dispatch, totalItems, totalPrice } = useCart()

  return (
    <aside className="rounded-xl bg-white p-6">
      <h2 className="mb-6 text-2xl font-bold text-red">Your Cart ({totalItems})</h2>

      {state.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <img src="/assets/images/illustration-empty-cart.svg" alt="" />
          <p className="text-sm font-semibold text-rose-500">Your added items will appear here</p>
        </div>
      ) : (
        <>
          <ul>
            {state.items.map(({ dessert, quantity }) => (
              <li key={dessert.name} className="flex items-center justify-between border-b border-rose-100 py-4">
                <div>
                  <p className="mb-2 text-sm font-semibold">{dessert.name}</p>
                  <p className="text-sm">
                    <span className="mr-2 font-semibold text-red">{quantity}x</span>
                    <span className="mr-2 text-rose-500">@ {money(dessert.price)}</span>
                    <span className="font-semibold text-rose-500">{money(quantity * dessert.price)}</span>
                  </p>
                </div>
                <button
                  aria-label={`Remove ${dessert.name}`}
                  onClick={() => dispatch({ type: 'REMOVE', name: dessert.name })}
                  className={`grid size-5 cursor-pointer place-items-center rounded-full border border-rose-300 hover:border-rose-900 ${focus}`}
                >
                  <img src="/assets/images/icon-remove-item.svg" alt="" />
                </button>
              </li>
            ))}
          </ul>

          <div className="my-6 flex items-center justify-between">
            <span className="text-sm">Order Total</span>
            <span className="text-3xl font-bold">{money(totalPrice)}</span>
          </div>

          <p className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-rose-50 p-4 text-sm">
            <img src="/assets/images/icon-carbon-neutral.svg" alt="" />
            <span>This is a <b className="font-semibold">carbon-neutral</b> delivery</span>
          </p>

          <button
            onClick={() => dispatch({ type: 'CONFIRM' })}
            className={`w-full cursor-pointer rounded-full bg-red py-4 font-semibold text-white hover:bg-red-dark ${focus}`}
          >
            Confirm Order
          </button>
        </>
      )}
    </aside>
  )
}
/* ---------- Order modal ---------- */
function OrderModal() {
  const { state, dispatch, totalPrice } = useCart()
  if (!state.confirmed) return null

  return (
    <div className="fixed inset-0 z-10 flex items-end bg-black/50 md:items-center md:justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 md:max-w-xl md:rounded-xl md:p-10"
      >
        <img src="/assets/images/icon-order-confirmed.svg" alt="" />
        <h2 id="order-title" className="mt-6 text-[40px] leading-tight font-bold">Order Confirmed</h2>
        <p className="mt-2 mb-8 text-rose-500">We hope you enjoy your food!</p>

        <div className="rounded-lg bg-rose-50 p-6">
          <ul>
            {state.items.map(({ dessert, quantity }) => (
              <li key={dessert.name} className="flex items-center gap-4 border-b border-rose-100 py-4 first:pt-0">
                <img src={asset(dessert.image.thumbnail)} alt="" className="size-12 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{dessert.name}</p>
                  <p className="text-sm">
                    <span className="mr-2 font-semibold text-red">{quantity}x</span>
                    <span className="text-rose-500">@ {money(dessert.price)}</span>
                  </p>
                </div>
                <span className="font-semibold">{money(quantity * dessert.price)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-6">
            <span className="text-sm">Order Total</span>
            <span className="text-3xl font-bold">{money(totalPrice)}</span>
          </div>
        </div>

        <button
          autoFocus
          onClick={() => dispatch({ type: 'RESET' })}
          className={`mt-8 w-full cursor-pointer rounded-full bg-red py-4 font-semibold text-white hover:bg-red-dark ${focus}`}
        >
          Start New Order
        </button>
      </div>
    </div>
  )
}

/* ---------- App ---------- */
export default function App() {
  return (
    <CartProvider>
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_384px] lg:items-start lg:px-10 lg:py-20">
        <section>
          <h1 className="mb-8 text-[40px] leading-tight font-bold">Desserts</h1>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
            {desserts.map(d => (
              <DessertCard key={d.name} dessert={d} />
            ))}
          </ul>
        </section>
        <Cart />
        <OrderModal />
      </main>
    </CartProvider>
  )
}