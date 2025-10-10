import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Banques() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Banques</h1>
        <p className="text-muted-foreground mt-1">
          Gestion des banques et des guichets
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
          <CardDescription>
            Cette page sera bientôt disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Le module de gestion des banques est en cours de développement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
