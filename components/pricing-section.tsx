import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function PricingSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choose the plan that's right for your engineering team
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 md:gap-8">
          <div className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-850 justify-between border border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-2xl font-bold text-center">Starter</h3>
              <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                <span className="text-4xl font-bold text-black dark:text-white">$49</span>/ month
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Parts Generation (10/month)</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Standards Checker</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Basic CAD Search</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Email Support</span>
                </li>
              </ul>
            </div>
            <div className="mt-6">
              <Button className="w-full">Get Started</Button>
            </div>
          </div>
          <div className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-850 justify-between border border-gray-200 dark:border-gray-800 relative">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Popular
            </div>
            <div>
              <h3 className="text-2xl font-bold text-center">Professional</h3>
              <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                <span className="text-4xl font-bold text-black dark:text-white">$99</span>/ month
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Parts Generation (50/month)</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Advanced Standards Checker</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Live Pricing</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Advanced CAD Search</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Priority Support</span>
                </li>
              </ul>
            </div>
            <div className="mt-6">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">Get Started</Button>
            </div>
          </div>
          <div className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-850 justify-between border border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-2xl font-bold text-center">Enterprise</h3>
              <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
                <span className="text-4xl font-bold text-black dark:text-white">Custom</span>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Unlimited Parts Generation</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Custom Standards Integration</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Advanced Live Pricing</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Enterprise CAD Search</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>Dedicated Support</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-2 h-5 w-5" />
                  <span>API Access</span>
                </li>
              </ul>
            </div>
            <div className="mt-6">
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
