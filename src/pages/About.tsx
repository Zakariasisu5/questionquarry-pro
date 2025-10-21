import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import developerImage from "@/assets/developer.png";
import sponsorImage from "@/assets/sponsor.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">About Us</h1>
          <Navigation />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Developer Section */}
          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src={developerImage} 
                  alt="Zakaria Sisu (Selassie)" 
                  className="w-48 h-48 rounded-full object-cover shadow-lg"
                />
              </div>
              <CardTitle className="text-2xl">Zakaria Sisu (Selassie)</CardTitle>
              <CardDescription className="text-lg">Developer</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a 
                  href="mailto:zakariasisu5@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  zakariasisu5@gmail.com
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Sponsor Section */}
          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src={sponsorImage} 
                  alt="Survival" 
                  className="w-48 h-48 rounded-full object-cover shadow-lg"
                />
              </div>
              <CardTitle className="text-2xl">Survival</CardTitle>
              <CardDescription className="text-lg">Sponsor</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg font-medium italic text-muted-foreground">
                "A leadership for services"
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mission Statement */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">About UDS StudyHub</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground max-w-3xl mx-auto">
              UDS StudyHub is an academic resource sharing platform designed to help students 
              access and share educational materials. Built to foster collaboration and learning 
              within the university community.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default About;
