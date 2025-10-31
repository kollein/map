import { Kafka } from 'kafkajs'
import { addPlace } from '@/addPlace'
import { PlaceMessage } from './type'

const kafka = new Kafka({
  clientId: 'place-service',
  brokers: ['localhost:9092'],
})

const consumer = kafka.consumer({ groupId: 'place-group' })

async function runConsumer() {
  await consumer.connect()
  await consumer.subscribe({ topic: 'place-topic', fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const place: PlaceMessage = JSON.parse(message.value!.toString())
        console.log(`📥 Received: ${place.name}`)
        await addPlace(place)
      } catch (err) {
        console.error('❌ Error processing message:', err)
      }
    },
  })
}

runConsumer().catch(console.error)
