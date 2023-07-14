import { Conversation } from '@botpress/client'
import { AckFunction } from '@botpress/sdk'
import { Context, Markup, Telegraf } from 'telegraf'
import type { Message, Update } from 'telegraf/typings/core/types/typegram'
import type { Card } from '../.botpress/implementation/channels/channel/card'
import { IntegrationProps } from '.botpress'

const defaultMessages: IntegrationProps['channels']['channel']['messages'] = {
  text: async ({ payload, ctx, conversation, ack }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendMessage(getChat(conversation), payload.text)
    await ackMessage(message, ack)
  },
  image: async ({ payload, ctx, conversation, ack }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendPhoto(getChat(conversation), payload.imageUrl)
    await ackMessage(message, ack)
  },
  markdown: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendMessage(getChat(conversation), payload.markdown, {
      parse_mode: 'MarkdownV2',
    })
    await ackMessage(message, ack)
  },
  audio: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendAudio(getChat(conversation), payload.audioUrl)
    await ackMessage(message, ack)
  },
  video: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendVideo(getChat(conversation), payload.videoUrl)
    await ackMessage(message, ack)
  },
  file: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendDocument(getChat(conversation), payload.fileUrl)
    await ackMessage(message, ack)
  },
  location: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const message = await client.telegram.sendLocation(getChat(conversation), payload.latitude, payload.longitude)
    await ackMessage(message, ack)
  },
  card: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    await sendCard(payload, client, conversation, ack)
  },
  carousel: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    payload.items.forEach(async (item) => {
      await sendCard(item, client, conversation, ack)
    })
  },
  dropdown: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
    console.log(Markup.keyboard(buttons).oneTime())
    const message = await client.telegram.sendMessage(
      getChat(conversation),
      payload.text,
      Markup.keyboard(buttons).oneTime()
    )
    await ackMessage(message, ack)
  },
  choice: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)
    const buttons = payload.options.map((choice) => Markup.button.callback(choice.label, choice.value))
    const message = await client.telegram.sendMessage(
      getChat(conversation),
      payload.text,
      Markup.keyboard(buttons).oneTime()
    )
    await ackMessage(message, ack)
  },
  raw: async ({ ctx, conversation, ack, payload }) => {
    const client = new Telegraf(ctx.configuration.botToken)

    for (const item of payload.payloads) {
      const fnName = `send${item.send_type.charAt(0).toUpperCase() + item.send_type.slice(1)}` as any
      const message = (await client.telegram.callApi(fnName, { chat_id: getChat(conversation), ...item })) as Message
      await ackMessage(message, ack)
    }
  },
}

export default {
  channel: { messages: defaultMessages },
} satisfies IntegrationProps['channels']

async function sendCard(
  payload: Card,
  client: Telegraf<Context<Update>>,
  conversation: Conversation,
  ack: AckFunction
) {
  const text = `*${payload.title}*${payload.subtitle ? '\n' + payload.subtitle : ''}`
  const buttons = payload.actions
    .filter((item) => item.value && item.label)
    .map((item) => {
      switch (item.action) {
        case 'url':
          return Markup.button.url(item.label, item.value)
        case 'postback':
          return Markup.button.callback(item.label, `postback:${item.value}`)
        case 'say':
          return Markup.button.callback(item.label, `say:${item.value}`)
        default:
          throw new Error(`Unknown action type: ${item.action}`)
      }
    })
  if (payload.imageUrl) {
    const message = await client.telegram.sendPhoto(getChat(conversation), payload.imageUrl, {
      caption: text,
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    })
    await ackMessage(message, ack)
  } else {
    const message = await client.telegram.sendMessage(getChat(conversation), text, {
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    })
    await ackMessage(message, ack)
  }
}

function getChat(conversation: Conversation): string {
  const chat = conversation.tags['telegram:id']

  if (!chat) {
    throw Error(`No chat found for conversation ${conversation.id}`)
  }

  return chat
}

type TelegramMessage = {
  message_id: number
}

async function ackMessage(message: TelegramMessage, ack: AckFunction) {
  await ack({ tags: { 'telegram:id': `${message.message_id}` } })
}