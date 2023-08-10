export type TriggerPayload = ReturnType<typeof getTriggerTemplate>

export const getTriggerTemplate = (name: TriggerNames) => ({
  type: name,
  agent: '{{current_user.email}}',
  comment: '{{ticket.latest_public_comment_html}}',
  ticketId: '{{ticket.id}}',
  currentUser: {
    id: '{{current_user.id}}',
    name: '{{current_user.name}}',
    email: '{{current_user.email}}',
    externalId: '{{current_user.external_id}}',
    role: '{{current_user.role}}',
  },
})

export type Condition = {
  field: string
  operator: string
  value: string
}

export type ConditionsData = {
  all: ReadonlyArray<Condition>
  any: ReadonlyArray<Condition>
}

export const Triggers = [
  {
    name: 'ticketAssigned',
    conditions: {
      all: [
        {
          field: 'assignee_id',
          operator: 'value_previous',
          value: '',
        },
      ],
      any: [],
    },
  },
  {
    name: 'ticketSolved',
    conditions: {
      all: [
        {
          field: 'status',
          operator: 'value',
          value: 'SOLVED',
        },
      ],
      any: [],
    },
  },
  {
    name: 'newMessage',
    conditions: {
      all: [
        {
          field: 'comment_is_public',
          operator: 'is',
          value: 'requester_can_see_comment',
        },
        {
          field: 'current_via_id',
          operator: 'is_not',
          value: '5',
        },
      ],
      any: [],
    },
  },
] as const satisfies ReadonlyArray<{ name: string; conditions: ConditionsData }>

export type TriggerNames = (typeof Triggers)[number]['name']
