import React, { useState, useEffect } from "react";
import { Strategy, Business } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PullToRefresh from "@/components/PullToRefresh";
import AppLayout from "@/components/AppLayout";
import { Calendar, ArrowLeft, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { coreOfferOf } from "@/lib/strategy";

export default function LaunchCalendar() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [launchCalendar, setLaunchCalendar] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError(null);
    try {
        const [strategyData, businessData] = await Promise.all([
          Strategy.list("-created_date"),
          Business.list("-created_date")
        ]);
        setStrategies(strategyData);
        setBusinesses(businessData);
        
        if (strategyData.length > 0) {
          setSelectedStrategy(strategyData[0]);
          if (strategyData[0].launch_calendar) {
            setLaunchCalendar(strategyData[0].launch_calendar);
          }
        }
    } catch(err) {
        console.error("Failed to load data:", err);
        setError("Could not load strategies or businesses. Please refresh.");
    }
  };

  const getBusinessForStrategy = (strategy) => {
    return businesses.find(b => b.id === strategy.business_id);
  };

  const generateLaunchCalendar = async () => {
    if (!selectedStrategy) return;

    const business = getBusinessForStrategy(selectedStrategy);
    if (!business) {
      setError("This strategy's business profile was deleted. Generate a new strategy first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const timeline = business.timeline || "30-days";
      // Up to 30 daily actions per calendar keeps it fast and readable.
      const days = Math.min(30, Math.max(7, parseInt(String(timeline).match(/\d+/)?.[0], 10) || 30));

      const prompt = `
You are an elite launch strategist creating a ${days}-day launch calendar. This needs to be focused and results-driven.

BUSINESS CONTEXT:
- Name: ${business.business_name}
- Industry: ${business.industry}
- Target: ${business.target_avatar}
- Core Offer: ${coreOfferOf(selectedStrategy).name || "Main offer"}${coreOfferOf(selectedStrategy).price ? ` at $${coreOfferOf(selectedStrategy).price}` : ""}
- Lead Magnet: ${selectedStrategy.funnel_map?.lead_magnet || "Free lead magnet"}

Create a ${days}-day launch calendar with daily actions. Each day needs:
1. Hook: Attention-grabbing content angle (specific, controversial, valuable)
2. CTA: Clear call-to-action 
3. Content Type: Format (video, post, email, etc.)

Make this execution-focused:
- Bold claims backed by value
- Controversial takes that get attention  
- Pattern interrupts
- Social proof and authority building
- Urgency and scarcity
- Direct response copywriting

Be specific about the hooks - no generic "tips". Give me actual content angles that will make people stop scrolling.
      `;

      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            calendar: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  hook: { type: "string" },
                  cta: { type: "string" },
                  content_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      const calendar = Array.isArray(result?.calendar) ? result.calendar : [];
      if (!calendar.length) throw new Error("Empty calendar");
      setLaunchCalendar(calendar.map((item, index) => ({ ...item, day: Number(item.day) || index + 1 })));
    } catch (error) {
      console.error("Error generating launch calendar:", error);
      setError("The AI failed to generate a launch calendar. Please try again.");
    }
    setIsGenerating(false);
  };

  const saveLaunchCalendar = async () => {
    if (!selectedStrategy || !launchCalendar.length) return;

    setIsSaving(true);
    setError(null);
    try {
      await Strategy.update(selectedStrategy.id, {
        ...selectedStrategy,
        launch_calendar: launchCalendar
      });
    } catch (error) {
      console.error("Error saving calendar:", error);
      setError("Failed to save the calendar. Please try again.");
    }
    setIsSaving(false);
  };

  const getContentTypeColor = (type) => {
    const colors = {
      'video': 'bg-red-100 text-red-800',
      'post': 'bg-blue-100 text-blue-800',
      'email': 'bg-green-100 text-green-800',
      'story': 'bg-purple-100 text-purple-800',
      'live': 'bg-yellow-100 text-yellow-800'
    };
    return colors[String(type || "").toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AppLayout>
    <PullToRefresh onRefresh={loadData}>
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-yellow-400 rounded-lg">
              <Calendar className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">LAUNCH CALENDAR</h1>
              <p className="text-muted-foreground">Your day-by-day roadmap to domination.</p>
            </div>
          </div>
        </div>
        
        {error && (
            <div className="bg-red-900 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
            </div>
        )}

        {/* Strategy Selection */}
        <Card className="dark-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-bold">SELECT STRATEGY</CardTitle>
          </CardHeader>
          <CardContent>
            {strategies.length > 0 ? (
              <Select 
                value={selectedStrategy?.id} 
                onValueChange={(value) => {
                  const strategy = strategies.find(s => s.id === value);
                  setSelectedStrategy(strategy);
                  if (strategy?.launch_calendar) {
                    setLaunchCalendar(strategy.launch_calendar);
                  } else {
                    setLaunchCalendar([]);
                  }
                }}
              >
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Choose your strategy" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {strategies.map((strategy) => {
                    const business = getBusinessForStrategy(strategy);
                    return (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {business?.business_name} - {coreOfferOf(strategy).name || "Strategy"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No strategies found. Generate your strategy first.</p>
                <Button onClick={() => navigate(createPageUrl("StrategyGenerator"))} className="bg-yellow-400 text-black font-bold">
                  Generate Strategy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Calendar */}
        {selectedStrategy && !launchCalendar.length && (
          <div className="text-center mb-8">
            <Button
              onClick={generateLaunchCalendar}
              disabled={isGenerating}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 text-xl"
            >
              {isGenerating ? (
                "BUILDING YOUR CALENDAR..."
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-3" />
                  GENERATE LAUNCH CALENDAR
                </>
              )}
            </Button>
          </div>
        )}

        {/* Launch Calendar */}
        {launchCalendar.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">YOUR LAUNCH ROADMAP</h2>
              <Button
                onClick={saveLaunchCalendar}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600 text-primary-foreground font-bold"
              >
                {isSaving ? "SAVING..." : "SAVE CALENDAR"}
              </Button>
            </div>

            <div className="grid gap-4">
              {launchCalendar.map((day, index) => (
                <Card key={`${day.day}-${index}`} className="dark-card border-border hover:border-yellow-400 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-yellow-400 text-black rounded-full flex items-center justify-center font-black text-lg">
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getContentTypeColor(day.content_type)}>
                            {String(day.content_type || "post").toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="text-foreground font-bold text-lg mb-2">HOOK:</h3>
                        <p className="text-foreground/80 mb-4">{day.hook}</p>
                        <h3 className="text-yellow-400 font-bold mb-2">CALL-TO-ACTION:</h3>
                        <p className="text-foreground/80 font-semibold">{day.cta}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-sm">Day</p>
                        <p className="text-2xl font-black text-foreground">{day.day}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <Card className="dark-card border-green-500 mt-8">
              <CardHeader>
                <CardTitle className="text-green-400 font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  LAUNCH SUMMARY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">{launchCalendar.length}</p>
                    <p className="text-muted-foreground">Total Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">
                      {launchCalendar.filter(d => d.content_type.toLowerCase().includes('video')).length}
                    </p>
                    <p className="text-muted-foreground">Video Content</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">
                      {launchCalendar.filter(d => d.content_type.toLowerCase().includes('email')).length}
                    </p>
                    <p className="text-muted-foreground">Email Campaigns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-foreground">100%</p>
                    <p className="text-muted-foreground">Execution Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
    </PullToRefresh>
    </AppLayout>
  );
}