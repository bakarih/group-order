import { test, expect, Page } from '@playwright/test'

const ORDER_ID = '57b2d49e-b2be-4319-b2e9-27108d1344a4'
const HOST_TOKEN = '4b38f6ce-60cb-4180-be15-80355d8a1c00'
const GUEST_TOKEN = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const GUEST_PARTICIPANT_ID = 'guest-participant-id-001'

async function mockSupabase(page: Page) {
  await page.route('**/rest/v1/group_orders**', async (route) => {
    const method = route.request().method()
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: ORDER_ID,
          host_name: 'Bakari Holmes',
          host_email: 'bakari@example.com',
          status: 'active',
          created_at: new Date().toISOString(),
        }),
      })
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: ORDER_ID,
          host_name: 'Bakari Holmes',
          host_email: 'bakari@example.com',
          status: 'active',
          created_at: new Date().toISOString(),
        }),
      })
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ status: 'checked_out' }]),
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/rest/v1/participants**', async (route) => {
    const method = route.request().method()
    const url = route.request().url()

    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'host-participant-id-001',
          group_order_id: ORDER_ID,
          name: 'Bakari Holmes',
          email: 'bakari@example.com',
          join_token: HOST_TOKEN,
          is_host: true,
          joined_at: new Date().toISOString(),
        }),
      })
    } else if (method === 'GET') {
      if (url.includes(`join_token=eq.${GUEST_TOKEN}`)) {
        // Guest join page lookup — name matches email prefix so join screen shows
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: GUEST_PARTICIPANT_ID,
            group_order_id: ORDER_ID,
            name: 'vocaljazz32',
            email: 'vocaljazz32@gmail.com',
            join_token: GUEST_TOKEN,
            is_host: false,
            joined_at: new Date().toISOString(),
          }),
        })
      } else if (url.includes(`join_token=eq.${HOST_TOKEN}`)) {
        // Host menu page lookup
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'host-participant-id-001',
            group_order_id: ORDER_ID,
            name: 'Bakari Holmes',
            email: 'bakari@example.com',
            join_token: HOST_TOKEN,
            is_host: true,
            joined_at: new Date().toISOString(),
          }),
        })
      } else {
        // Dashboard participant list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'host-participant-id-001',
              group_order_id: ORDER_ID,
              name: 'Bakari Holmes',
              email: 'bakari@example.com',
              join_token: HOST_TOKEN,
              is_host: true,
              joined_at: new Date().toISOString(),
            },
            {
              id: GUEST_PARTICIPANT_ID,
              group_order_id: ORDER_ID,
              name: 'vocaljazz32',
              email: 'vocaljazz32@gmail.com',
              join_token: GUEST_TOKEN,
              is_host: false,
              joined_at: new Date().toISOString(),
            },
          ]),
        })
      }
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ name: 'Ayinde Holmes' }]),
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/rest/v1/cart_items**', async (route) => {
    const method = route.request().method()
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'cart-item-001',
          group_order_id: ORDER_ID,
          participant_id: 'host-participant-id-001',
          menu_item_id: 'jamba-mango',
          menu_item_name: 'Mango-A-Go-Go Smoothie',
          menu_item_price: 7.99,
          quantity: 1,
          added_at: new Date().toISOString(),
        }]),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    }
  })

  await page.route('**/realtime/v1/**', async (route) => {
    await route.abort()
  })
}

test.describe('Landing page', () => {
  test('shows the landing page with CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Order Together.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start a Group Order' })).toBeVisible()
  })

  test('navigates to /order/new on CTA click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Start a Group Order' }).click()
    await expect(page).toHaveURL('/order/new')
  })

  test('shows three feature cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Invite by email')).toBeVisible()
    await expect(page.getByText('Everyone picks', { exact: true })).toBeVisible()
    await expect(page.getByText('Host checks out')).toBeVisible()
  })
})

test.describe('Create order flow (/order/new)', () => {
  test('shows the new order form', async ({ page }) => {
    await page.goto('/order/new')
    await expect(page.getByPlaceholder('Your name')).toBeVisible()
    await expect(page.getByPlaceholder('Your email')).toBeVisible()
    await expect(page.getByPlaceholder('Guest 1 email')).toBeVisible()
  })

  test('shows error when name is missing', async ({ page }) => {
    await page.goto('/order/new')
    await page.getByRole('button', { name: /Create Group Order/i }).click()
    await expect(page.getByText('Please enter your name and email.')).toBeVisible()
  })

  test('shows error when no guest is invited', async ({ page }) => {
    await page.goto('/order/new')
    await page.getByPlaceholder('Your name').fill('Bakari Holmes')
    await page.getByPlaceholder('Your email').fill('bakari@example.com')
    await page.getByRole('button', { name: /Create Group Order/i }).click()
    await expect(page.getByText('Please invite at least one guest.')).toBeVisible()
  })

  test('redirects to dashboard after successful order creation', async ({ page }) => {
    await mockSupabase(page)
    await page.goto('/order/new')
    await page.getByPlaceholder('Your name').fill('Bakari Holmes')
    await page.getByPlaceholder('Your email').fill('bakari@example.com')
    await page.getByPlaceholder('Guest 1 email').fill('guest@example.com')
    await page.getByRole('button', { name: /Create Group Order/i }).click()
    await expect(page).toHaveURL(new RegExp(`/order/${ORDER_ID}`))
  })
})

test.describe('Menu page', () => {
  test('shows all three GoTo Foods menu items', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/menu?token=${HOST_TOKEN}`)
    await expect(page.getByText('Mango-A-Go-Go Smoothie')).toBeVisible()
    await expect(page.getByText('Cinnamon Sugar Pretzel')).toBeVisible()
    await expect(page.getByText('Homewrecker Burrito')).toBeVisible()
  })

  test('shows brand names', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/menu?token=${HOST_TOKEN}`)
    await expect(page.getByText('Jamba')).toBeVisible()
    await expect(page.getByText("Auntie Anne's")).toBeVisible()
    await expect(page.getByText("Moe's")).toBeVisible()
  })

  test('shows prices for all items', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/menu?token=${HOST_TOKEN}`)
    await expect(page.getByText('$7.99')).toBeVisible()
    await expect(page.getByText('$5.49')).toBeVisible()
    await expect(page.getByText('$11.99')).toBeVisible()
  })

  test('shows Add button for each menu item', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/menu?token=${HOST_TOKEN}`)
    await expect(page.getByRole('button', { name: 'Add' })).toHaveCount(3)
  })

  test('host sees back to dashboard link', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/menu?token=${HOST_TOKEN}`)
    await expect(page.getByText('← Back to Dashboard')).toBeVisible()
  })
})

test.describe('Guest join flow', () => {
  test('shows the join page for a valid token', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/join?token=${GUEST_TOKEN}`)
    await expect(page.getByText("You're invited!")).toBeVisible()
    await expect(page.getByPlaceholder('First name is fine')).toBeVisible()
  })

  test('shows join button', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/join?token=${GUEST_TOKEN}`)
    await expect(page.getByRole('button', { name: /Join & Browse Menu/i })).toBeVisible()
  })

  test('shows error when name is empty', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}/join?token=${GUEST_TOKEN}`)
    await page.getByPlaceholder('First name is fine').waitFor()
    await page.getByPlaceholder('First name is fine').fill('')
    await page.getByRole('button', { name: /Join & Browse Menu/i }).click()
    await expect(page.getByText('Please enter your name.')).toBeVisible()
  })
})

test.describe('Host dashboard', () => {
  test('shows order open status', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}?token=${HOST_TOKEN}`)
    await expect(page.getByText('Order open')).toBeVisible()
  })

  test('shows browse menu button', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}?token=${HOST_TOKEN}`)
    await expect(page.getByText('Browse Menu →')).toBeVisible()
  })

  test('shows order breakdown section', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}?token=${HOST_TOKEN}`)
    await expect(page.getByText('Order Breakdown')).toBeVisible()
  })

  test('shows group total', async ({ page }) => {
    await mockSupabase(page)
    await page.goto(`/order/${ORDER_ID}?token=${HOST_TOKEN}`)
    await expect(page.getByText('Group Total')).toBeVisible()
  })
})