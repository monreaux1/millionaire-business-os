import React, { useState, useEffect, useCallback } from "react";
import { Strategy, Business, User } from "@/entities/all";
import { SendEmail } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import AppLayout from "@/components/AppLayout";
import { coreOfferOf } from "@/lib/strategy";

export default function EmailBriefing() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [user, setUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [todaysPlan, setTodaysPlan] = useState(null);

  const calculateTodaysPlan = useCallback((strategy) => {
    if (!strategy?.launch_calendar) {
      setTodaysPlan(null);
      return;
    }
    
    // Calculate days since strategy creation
    const createdDate = new Date(strategy.created_date);
    const today = new Date();
    // Set both to midnight to compare dates correctly
    createdDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Find today's plan
    const plan = strategy.launch_calendar.find(p => p.day === daysSinceCreation);
    setTodaysPlan(plan);
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [strategyData, businessData, userData] = await Promise.all([
        Strategy.list("-created_date"),
        Business.list("-created_date"),
        User.me()
      ]);
      setStrategies(strategyData);
      setBusinesses(businessData);
      setUser(userData);
      
      if (strategyData.length > 0) {
        setSelectedStrategy(strategyData[0]);
        calculateTodaysPlan(strategyData[0]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Could not load your data. Please refresh.");
    }
  }, [calculateTodaysPlan]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getBusinessForStrategy = (strategy) => {
    return businesses.find(b => b.id === strategy.business_id);
  };

  const sendDailyBriefing = async () => {
    if (!selectedStrategy || !user || !todaysPlan) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const business = getBusinessForStrategy(selectedStrategy);
      
      const emailBody = `
🎯 DAILY BATTLE PLAN - DAY ${todaysPlan.day}

${user.full_name}, your mission today is CLEAR:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 BUSINESS: ${business?.business_name}
🎯 TARGET: ${business?.target_avatar?.slice(0, 100)}...
💰 CORE OFFER: ${coreOfferOf(selectedStrategy).name || "Main offer"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 TODAY'S HOOK:
${todaysPlan.hook}

⚡ YOUR CALL-TO-ACTION:
${todaysPlan.cta}

📱 CONTENT TYPE: ${String(todaysPlan.content_type || "post").toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 EXECUTION MINDSET:
"The market doesn't care about your feelings. It cares about VALUE. 
Today's content must solve a real problem or it's worthless."

🚀 EXECUTION BEATS PERFECTION. Get it done.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Built by Millionaire Business OS
💪 No excuses. Only results.
      `;

      await SendEmail({
        to: user.email,
        subject: `🎯 DAY ${todaysPlan.day}: Your Business Action Plan is Ready`,
        body: emailBody,
        from_name: "Millionaire Business OS"
      });

      setSuccess(`Daily briefing sent to ${user.email}! Check your inbox.`);
    } catch (error) {
      console.error("Error sending email:", error);
      setError("Failed to send your briefing. Try again.");
    }
    setIsSending(false);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={loadData}>
      <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
              <Mail className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">DAILY BATTLE PLAN</h1>
              <p className="text-muted-foreground">Get your daily strategy delivered to your inbox.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-900 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Strategy Selection */}
        <Card className="dark-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-bold">SELECT ACTIVE CAMPAIGN</CardTitle>
          </CardHeader>
          <CardContent>
            {strategies.length > 0 ? (
              <Select 
                value={selectedStrategy?.id} 
                onValueChange={(value) => {
                  const strategy = strategies.find(s => s.id === value);
                  setSelectedStrategy(strategy);
                  calculateTodaysPlan(strategy);
                }}
              >
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Choose your active launch" />
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

        {/* Today's Plan Preview */}
        {selectedStrategy && todaysPlan && (
          <Card className="dark-card border-yellow-400 mb-6">
            <CardHeader>
              <CardTitle className="text-yellow-400 font-bold flex items-center gap-2">
                TODAY'S BATTLE PLAN - DAY {todaysPlan.day}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-card rounded-lg">
                <h3 className="text-foreground font-bold mb-2">🔥 TODAY'S HOOK:</h3>
                <p className="text-foreground/80">{todaysPlan.hook}</p>
              </div>
              
              <div className="p-4 bg-card rounded-lg">
                <h3 className="text-yellow-400 font-bold mb-2">⚡ CALL-TO-ACTION:</h3>
                <p className="text-foreground/80 font-semibold">{todaysPlan.cta}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-800">
                  {String(todaysPlan.content_type || "post").toUpperCase()}
                </Badge>
                {user && (
                  <Badge variant="outline" className="text-foreground/80">
                    Sending to: {user.email}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedStrategy && !todaysPlan && (
          <Card className="dark-card border-border mb-6">
            <CardContent className="text-center py-8">
              <h3 className="text-muted-foreground font-bold mb-2">NO PLAN FOR TODAY</h3>
              <p className="text-muted-foreground">Either your launch hasn't started, it's completed, or the automation is handling it.</p>
            </CardContent>
          </Card>
        )}

        {/* Send Email Button */}
        {selectedStrategy && todaysPlan && (
          <div className="text-center">
            <Button
              onClick={sendDailyBriefing}
              disabled={isSending || !user}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 text-xl"
            >
              {isSending ? (
                "SENDING YOUR BRIEFING..."
              ) : (
                <>
                  <Send className="w-6 h-6 mr-3" />
                  SEND TODAY'S BATTLE PLAN MANUALLY
                </>
              )}
            </Button>
            
            <p className="text-muted-foreground mt-4 text-sm">
              The system is automated, but you can still send a manual briefing if needed.
            </p>
          </div>
        )}

        {/* Info Card */}
        <Card className="dark-card border-green-500 mt-8">
          <CardHeader>
            <CardTitle className="text-green-400 font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5"/>
              AUTOMATION ACTIVE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-4">
              Your Daily Battle Plan is now sent automatically every morning.
            </p>
            <p className="text-muted-foreground text-sm">
              To activate this, go to your app's dashboard, navigate to <strong>Code -&gt; Functions -&gt; dailyBriefing</strong>, and set up a daily schedule (cron job) to run it. A common cron expression for 7 AM daily is <code className="bg-secondary p-1 rounded">0 7 * * *</code>.
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}