import { Cpu, Search, DollarSign, CheckSquare } from "lucide-react"

export function FeatureHighlights() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Key Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Supercharge Your CAD Workflow</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Our AI-powered tools handle low-value CAD tasks so you can focus on real mechanical design.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Cpu className="h-12 w-12 text-purple-500" />
            <h3 className="text-xl font-bold">Parts Generation</h3>
            <p className="text-sm text-gray-500 text-center dark:text-gray-400">
              Create fully parametric and editable parts from text or sketches
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <CheckSquare className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-bold">Standards Checker</h3>
            <p className="text-sm text-gray-500 text-center dark:text-gray-400">
              Automatically verify models against industry standards
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <DollarSign className="h-12 w-12 text-blue-500" />
            <h3 className="text-xl font-bold">Live Pricing</h3>
            <p className="text-sm text-gray-500 text-center dark:text-gray-400">
              Get instant cost estimates as you design
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Search className="h-12 w-12 text-orange-500" />
            <h3 className="text-xl font-bold">AI CAD Searcher</h3>
            <p className="text-sm text-gray-500 text-center dark:text-gray-400">
              Find parts instantly using keywords or sketches
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
