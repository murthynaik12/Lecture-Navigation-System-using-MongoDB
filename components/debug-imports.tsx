// This file is for debugging import issues
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DebugImports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Imports</CardTitle>
        <CardDescription>Testing component imports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="test">Test Label</Label>
            <Input id="test" />
          </div>
          <Button>Test Button</Button>
        </div>
      </CardContent>
      <CardFooter>
        <p>Footer</p>
      </CardFooter>
    </Card>
  )
}

