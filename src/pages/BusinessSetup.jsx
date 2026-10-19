import React, { useEffect, useState } from "react";
import { Business } from "@/entities/all";
import { syncBusinessProfileToBrowser } from "@/lib/business-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PullToRefresh from "@/components/PullToRefresh";
import { createPageUrl } from "@/utils";
import { Target, ArrowLeft, CheckCircle, Shield, Flag, Box, Zap, Clock, ThumbsUp } from "lucide-react";

export default function BusinessSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    business_name: "",
    industry: "",
    target_avatar: "",
    current_revenue: 0,
    desired_revenue: 0,
    core_service: "",
    pricing_model: "",
    biggest_challenge: "",
    unique_advantage: "",
    timeline: "",
    launch_purpose: "",
    risks_and_redundancies: "",
    dream_outcome: "",
    likelihood_of_achievement_proof: "",
    time_delay_to_result: "",
    effort_and_sacrifice_reduced: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const loadProfile = async () => {
    try {
      const businesses = await Business.list("-updated_date", 1);
      const business = businesses?.[0];
      if (business) {
        setCurrentBusinessId(business.id);
        setFormData((current) =>
          Object.keys(current).reduce((profile, key) => {
            profile[key] = business[key] ?? current[key];
            return profile;
          }, {})
        );
      }
    } catch (error) {
      console.warn("Existing business profile could not be loaded:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let savedBusiness;
      if (currentBusinessId) {
        savedBusiness = await Business.update(currentBusinessId, {
          ...formData,
          profile_version: 2,
          profile_source: "business_setup",
          last_synced_at: new Date().toISOString()
        });
      } else {
        savedBusiness = await Business.create({
          ...formData,
          profile_version: 2,
          profile_source: "business_setup",
          last_synced_at: new Date().toISOString()
        });
        setCurrentBusinessId(savedBusiness.id);
      }
      syncBusinessProfileToBrowser(savedBusiness);
      navigate("/BrandProfile");
    } catch (error) {
      console.error("Error creating business:", error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <AppLayout>
    <PullToRefresh onRefresh={loadProfile}>
    <div className="min-h-screen bg-background p-4 md:p-8">
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
            <div className="p-3 bg-primary rounded-lg">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">BUSINESS PROFILE</h1>
              <p className="text-muted-foreground">Your shared business intelligence for every strategy tool.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="light-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground font-bold text-xl">BUSINESS BASICS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground font-semibold">Business Name*</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="bg-card border-border text-foreground mt-2"
                    placeholder="What's your empire called?"
                    required
                  />
                </div>
                
                <div>
                  <Label className="text-muted-foreground font-semibold">Industry/Niche*</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="bg-card border-border text-foreground mt-2"
                    placeholder="e.g., E-commerce, Coaching, SaaS"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold">Core Service/Product*</Label>
                <Input
                  value={formData.core_service}
                  onChange={(e) => handleInputChange('core_service', e.target.value)}
                  className="bg-card border-border text-foreground mt-2"
                  placeholder="What do you sell?"
                  required
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold">Target Avatar*</Label>
                <Textarea
                  value={formData.target_avatar}
                  onChange={(e) => handleInputChange('target_avatar', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-24"
                  placeholder="Who is your dream customer? Be specific - age, income, problems, desires..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Revenue & Pricing */}
          <Card className="light-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground font-bold text-xl">REVENUE & PRICING</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground font-semibold">Current Monthly Revenue ($)</Label>
                  <Input
                    type="number"
                    value={formData.current_revenue}
                    onChange={(e) => handleInputChange('current_revenue', Number(e.target.value))}
                    className="bg-card border-border text-foreground mt-2"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-muted-foreground font-semibold">Target Monthly Revenue ($)</Label>
                  <Input
                    type="number"
                    value={formData.desired_revenue}
                    onChange={(e) => handleInputChange('desired_revenue', Number(e.target.value))}
                    className="bg-card border-border text-foreground mt-2"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold">Current Pricing Model</Label>
                <Select onValueChange={(value) => handleInputChange('pricing_model', value)}>
                  <SelectTrigger className="bg-card border-border text-foreground mt-2">
                    <SelectValue placeholder="How do you charge?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="one-time">One-time Payment</SelectItem>
                    <SelectItem value="subscription">Subscription/Recurring</SelectItem>
                    <SelectItem value="retainer">Monthly Retainer</SelectItem>
                    <SelectItem value="commission">Commission-based</SelectItem>
                    <SelectItem value="hybrid">Hybrid Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* New Value Equation Card */}
          <Card className="light-card border-primary/30">
            <CardHeader>
              <CardTitle className="text-primary font-bold text-xl flex items-center gap-2">
                <Box className="w-6 h-6" />
                VALUE EQUATION
              </CardTitle>
              <p className="text-muted-foreground text-sm">This is the engine of your irresistible offer. Be specific.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  Dream Outcome
                </Label>
                <Textarea
                  value={formData.dream_outcome}
                  onChange={(e) => handleInputChange('dream_outcome', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-20"
                  placeholder="What is the ultimate 'heaven' your customer will experience? (e.g., 'Land 5 high-ticket clients and have a waiting list in 30 days.')"
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Likelihood of Achievement Proof
                </Label>
                <Textarea
                  value={formData.likelihood_of_achievement_proof}
                  onChange={(e) => handleInputChange('likelihood_of_achievement_proof', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-20"
                  placeholder="How do you prove this is real? (e.g., '3 case studies of clients who did it,' 'My own business went from $0 to $1M in 12 months using this.')"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Time Delay to Result
                  </Label>
                  <Input
                    value={formData.time_delay_to_result}
                    onChange={(e) => handleInputChange('time_delay_to_result', e.target.value)}
                    className="bg-card border-border text-foreground mt-2"
                    placeholder="e.g., 'Results in 14 days'"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    Effort & Sacrifice Reduced
                  </Label>
                  <Input
                    value={formData.effort_and_sacrifice_reduced}
                    onChange={(e) => handleInputChange('effort_and_sacrifice_reduced', e.target.value)}
                    className="bg-card border-border text-foreground mt-2"
                    placeholder="e.g., 'Without cold calling'"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Context */}
          <Card className="light-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground font-bold text-xl">STRATEGIC CONTEXT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                  <Flag className="w-4 h-4 text-primary" />
                  Launch Purpose (The "Why")
                </Label>
                <Textarea
                  value={formData.launch_purpose}
                  onChange={(e) => handleInputChange('launch_purpose', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-20"
                  placeholder="What is the mission behind this launch, beyond just making money? (e.g., 'To set a new standard for quality in our industry.')"
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold">Biggest Challenge</Label>
                <Textarea
                  value={formData.biggest_challenge}
                  onChange={(e) => handleInputChange('biggest_challenge', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-20"
                  placeholder="What's stopping you from hitting your revenue goals?"
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold">Unique Advantage</Label>
                <Textarea
                  value={formData.unique_advantage}
                  onChange={(e) => handleInputChange('unique_advantage', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-20"
                  placeholder="What makes you different? Why should customers choose YOU?"
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Risks & Redundancies
                </Label>
                <Textarea
                  value={formData.risks_and_redundancies}
                  onChange={(e) => handleInputChange('risks_and_redundancies', e.target.value)}
                  className="bg-card border-border text-foreground mt-2 h-20"
                  placeholder="What could go wrong? What are your backups? (e.g., 'Payment processor fails -> Backup processor ready', 'Ad account gets banned -> Have backup accounts warmed up')"
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-semibold">Launch Timeline</Label>
                <Select onValueChange={(value) => handleInputChange('timeline', value)}>
                  <SelectTrigger className="bg-card border-border text-foreground mt-2">
                    <SelectValue placeholder="How fast do you want to move?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="14-days">14 Days (Fast & Furious)</SelectItem>
                    <SelectItem value="30-days">30 Days (Steady Build)</SelectItem>
                    <SelectItem value="60-days">60 Days (Strategic Rollout)</SelectItem>
                    <SelectItem value="90-days">90 Days (Comprehensive Launch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoadingProfile || isSubmitting || !formData.business_name || !formData.industry || !formData.target_avatar || !formData.core_service}
              className="accent-gradient text-white font-bold px-8 py-3 text-lg hover:opacity-90"
            >
              {isLoadingProfile ? (
                "LOADING PROFILE..."
              ) : isSubmitting ? (
                "SAVING PROFILE..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  SAVE PROFILE & BUILD STRATEGY
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </PullToRefresh>
    </AppLayout>
  );
}