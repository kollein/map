import { PlaceMessage } from '@/type'
import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'place-parser',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer()

export async function sendPlaceMessage(place: PlaceMessage) {
  await producer.connect()
  await producer.send({
    topic: 'place-topic',
    messages: [{ value: JSON.stringify(place) }],
  })
}
