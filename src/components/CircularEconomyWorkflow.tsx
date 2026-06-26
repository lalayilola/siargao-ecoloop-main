import { Card } from "@/components/ui/card";
import { Sprout, Utensils, Truck, Recycle, Leaf, ArrowRight } from "lucide-react";

export function CircularEconomyWorkflow() {
  const steps = [
    { icon: Sprout, label: "Farmer", description: "Produces crops", color: "bg-green-500" },
    { icon: Utensils, label: "Hotel/Restaurant", description: "Buys produce", color: "bg-blue-500" },
    { icon: Truck, label: "Food Waste", description: "Generated waste", color: "bg-orange-500" },
    { icon: Recycle, label: "LGU", description: "Collects & processes", color: "bg-purple-500" },
    { icon: Leaf, label: "Compost", description: "Organic fertilizer", color: "bg-emerald-500" },
  ];

  return (
    <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10">
      <h3 className="text-lg font-semibold text-primary mb-4 text-center">Circular Economy Workflow</h3>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center min-w-[100px]">
            <div className={`p-3 rounded-full ${step.color} text-white shadow-md`}>
              <step.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium mt-2 text-center">{step.label}</p>
            <p className="text-[10px] text-slate-500 text-center">{step.description}</p>
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-primary/50 mt-1" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-primary">Zero Waste Program:</span> Converting food waste into compost for sustainable agriculture
        </p>
      </div>
    </Card>
  );
}
