import { getPayloadClient } from '../payload'

export interface CreateMessageInput {
  name: string
  email: string
  message: string
}

export async function createMessage(
  input: CreateMessageInput,
): Promise<{ success: boolean }> {
  try {
    const payload = await getPayloadClient()

    await payload.create({
      collection: 'messages',
      data: input,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to save contact message to Payload.', error)

    return { success: false }
  }
}
