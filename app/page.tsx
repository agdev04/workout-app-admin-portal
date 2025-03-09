import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Dumbbell, Zap, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">VPA Workout Mobile App</h1>
          <p className="text-xl mb-8">Your personal fitness companion, anytime, anywhere.</p>
          <div className="flex justify-center space-x-4">
            <Button className="bg-white text-primary hover:bg-gray-200">Download for iOS</Button>
            <Button className="bg-white text-primary hover:bg-gray-200">Download for Android</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <Image
              src="/placeholder.svg?height=600&width=300"
              alt="VPA Workout App Screenshot"
              width={300}
              height={600}
              className="mx-auto rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Scan to Download</h2>
            <p className="mb-4">
              Use your camera app to scan the QR code and download the VPA Workout App directly to your device.
            </p>
            <Image
              src="/placeholder.svg?height=200&width=200"
              alt="QR Code for App Download"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: Smartphone,
              title: "User-Friendly Interface",
              description: "Intuitive design for effortless navigation and workout tracking.",
            },
            {
              icon: Dumbbell,
              title: "Customized Workouts",
              description: "Personalized exercise plans tailored to your fitness goals.",
            },
            {
              icon: Zap,
              title: "Real-Time Progress Tracking",
              description: "Monitor your improvements with detailed statistics and charts.",
            },
            {
              icon: Users,
              title: "Community Support",
              description: "Connect with fellow fitness enthusiasts for motivation and tips.",
            },
          ].map((feature, index) => (
            <Card key={index} className="bg-white text-primary">
              <CardContent className="p-6">
                <feature.icon className="w-12 h-12 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl mb-8">Download the VPA Workout App today and start achieving your health goals!</p>
          <Button className="bg-white text-primary hover:bg-gray-200 text-lg px-8 py-3">Get Started Now</Button>
        </div>
      </main>
    </div>
  )
}

