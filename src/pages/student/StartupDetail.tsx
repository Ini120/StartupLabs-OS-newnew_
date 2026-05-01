import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, TrendingUp, Clock, Target, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StageBadge } from '@/components/shared/Stagebadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyStartups } from '@/hooks/use-startups';
import { useMilestonesByStartups } from '@/hooks/use-milestones';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: startups = [], isLoading: startupsLoading } = useMyStartups();
  const { data: allMilestones = [], isLoading: milestonesLoading } = useMilestonesByStartups(startups.map(s => s.id));

  const startup = startups.find(s => s.id === id);
  const startupMilestones = allMilestones.filter(m => m.startup_id === id);

  // Mock data for hours worked per day
  const hoursWorkedData = [
    { day: 'Mon', hours: 4.5, tasks: 3 },
    { day: 'Tue', hours: 5.2, tasks: 4 },
    { day: 'Wed', hours: 3.8, tasks: 2 },
    { day: 'Thu', hours: 6.1, tasks: 5 },
    { day: 'Fri', hours: 4.7, tasks: 3 },
    { day: 'Sat', hours: 2.3, tasks: 1 },
    { day: 'Sun', hours: 3.0, tasks: 2 },
  ];

  // Progress timeline data
  const progressData = [
    { week: 'Week 1', progress: 10, milestones: 1 },
    { week: 'Week 2', progress: 25, milestones: 2 },
    { week: 'Week 3', progress: 35, milestones: 3 },
    { week: 'Week 4', progress: 50, milestones: 4 },
    { week: 'Week 5', progress: 65, milestones: 5 },
    { week: 'Week 6', progress: 80, milestones: 7 },
  ];

  // Milestone breakdown
  const milestonePie = [
    { name: 'Completed', value: startupMilestones.filter(m => m.status === 'completed').length },
    { name: 'In Progress', value: startupMilestones.filter(m => m.status === 'in-progress').length },
    { name: 'Pending', value: startupMilestones.filter(m => m.status === 'pending').length },
  ].filter(d => d.value > 0);

  const pieColors = ['hsl(168 60% 54%)', 'hsl(32 95% 50%)', 'hsl(215 22% 75%)'];

  if (startupsLoading || milestonesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Rocket className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
        <p className="text-muted-foreground">Startup not found</p>
        <Button onClick={() => navigate('/startup')} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const completed = startupMilestones.filter(m => m.status === 'completed').length;
  const inProgress = startupMilestones.filter(m => m.status === 'in-progress').length;
  const pending = startupMilestones.filter(m => m.status === 'pending').length;
  const overallProgress = startupMilestones.length ? Math.round((completed / startupMilestones.length) * 100) : 0;
  const totalHours = hoursWorkedData.reduce((sum, d) => sum + d.hours, 0);
  const avgHoursPerDay = (totalHours / hoursWorkedData.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/startup')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                {startup.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StageBadge stage={startup.stage as any} />
                <Badge variant="outline" className="text-[10px]">{startupMilestones.length} milestones</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Progress</p>
                <p className="text-2xl font-bold text-primary mt-1">{overallProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Hours</p>
                <p className="text-2xl font-bold text-primary mt-1">{totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Daily</p>
                <p className="text-2xl font-bold text-primary mt-1">{avgHoursPerDay}h</p>
              </div>
              <Target className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Milestones</p>
                <p className="text-2xl font-bold text-primary mt-1">{completed}/{startupMilestones.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Progress Overview</CardTitle>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm font-medium text-muted-foreground">Milestone completion</span>
            <span className="text-sm font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="mt-3 h-2.5" />
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-success" />
            <span className="text-muted-foreground">{completed} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">{inProgress} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted" />
            <span className="text-muted-foreground">{pending} Pending</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Progress Over Time</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Weekly milestone completion trend</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={progressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="hsl(168 60% 54%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(168 60% 54%)', r: 4 }}
                  name="Progress %"
                />
                <Line
                  type="monotone"
                  dataKey="milestones"
                  stroke="hsl(32 95% 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(32 95% 50%)', r: 4 }}
                  name="Milestones"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Milestone Breakdown */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Milestone Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {milestonePie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={milestonePie}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {milestonePie.map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-4 w-full">
                  {milestonePie.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm" style={{ background: pieColors[i] }} />
                        {entry.name}
                      </span>
                      <span className="font-semibold text-primary">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm text-center">
                <Target className="h-10 w-10 mb-2 opacity-20" />
                No milestones yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hours Worked Chart */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Hours Worked by Day</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Weekly time investment per day</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hoursWorkedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: 'hsl(168 60% 54% / 0.1)' }} />
              <Legend />
              <Bar dataKey="hours" fill="hsl(168 60% 54%)" radius={[8, 8, 0, 0]} name="Hours Worked" />
              <Bar dataKey="tasks" fill="hsl(32 95% 50%)" radius={[8, 8, 0, 0]} name="Tasks Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Milestones List */}
      {startupMilestones.length > 0 && (
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">All Milestones ({startupMilestones.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {startupMilestones.map(milestone => (
              <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                <div className="mt-1">
                  {milestone.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {milestone.status === 'in-progress' && <Clock className="h-4 w-4 text-warning" />}
                  {milestone.status === 'pending' && <Circle className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{milestone.title}</p>
                  {milestone.description && <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {milestone.status === 'in-progress' ? 'In Progress' : milestone.status}
                  </Badge>
                  {milestone.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(milestone.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
