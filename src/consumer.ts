import { Kafka } from 'kafkajs'
import { addPlace } from '@/addPlace'
import { PlaceMessage } from './type'

const kafka = new Kafka({
  clientId: 'place-service',
  brokers: ['localhost:9092'],
})

const topic = 'place-topic'
const groupId = 'place-group'
const consumer = kafka.consumer({ groupId })

async function runConsumer() {
  await consumer.connect()
  await consumer.subscribe({ topic, fromBeginning: false })

  await consumer.run({
    autoCommit: false, //
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const raw = message.value?.toString()
        if (!raw) return

        const place: PlaceMessage = JSON.parse(raw)
        console.log(`📥 Received: ${place.name}`)

        await addPlace(place)

        // ✅ ACKNOWLEDGEMENT: Commit offset manually
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ])

        // console.log(`✅ Acknowledged offset ${message.offset} (${place.name})`)
      } catch (err) {
        console.error('❌ Error processing message:', err)
      }
    },
  })
}

runConsumer().catch(console.error)
