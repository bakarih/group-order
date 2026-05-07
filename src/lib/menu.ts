import { MenuItem } from '@/types'

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'jamba-mango',
    name: 'Mango-A-Go-Go Smoothie',
    description: 'Mango, peaches, strawberries, and orange sherbet blended fresh',
    price: 7.99,
    emoji: '🥤',
    brand: 'Jamba',
  },
  {
    id: 'auntie-pretzel',
    name: 'Cinnamon Sugar Pretzel',
    description: 'Hand-rolled soft pretzel tossed in cinnamon sugar with cream cheese dip',
    price: 5.49,
    emoji: '🥨',
    brand: "Auntie Anne's",
  },
  {
    id: 'moes-burrito',
    name: 'Homewrecker Burrito',
    description: 'Seasoned rice, beans, cheese, sour cream, pico, and your choice of protein',
    price: 11.99,
    emoji: '🌯',
    brand: "Moe's",
  },
]

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id)
}
