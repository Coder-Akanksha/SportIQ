import React from 'react';
import { useApp } from '../context/AppContext';
import { LiveCameraFeed } from '../components/VideoFeed/LiveCameraFeed';
import { PerformanceIndexGauge } from '../components/Analytics/PerformanceIndexGauge';
import { ElbowAngleChart } from '../components/Analytics/ElbowAngleChart';
import { ShotOutcomeCounter } from '../components/Analytics/ShotOutcomeCounter';
import { CoachingFeedback } from '../components/Analytics/CoachingFeedback';
import { KinematicChainChart } from '../components/Analytics/KinematicChainChart';
import { MetricCard } from '../components/Common/MetricCard';
import { Activity, Target, ShieldAlert, Award, Zap } from 'lucide-react';

export const Dashboard = () => {
  const { telemetry, sportType, dominantSide, dashboardData } = useApp();

  const metrics = dashboardData?.metrics || {
    totalShots: 25,
    totalMade: 20,
    overallAccuracy: 80.0,
    averagePerformanceIndex: 86.5,
    totalIllegalExtensions: 0
  };

  // Check if live telemetry is actively streaming from Python AI Engine WebSocket
  const isLive = Boolean(telemetry?.isLiveActive || (telemetry?.lastUpdate && Date.now() - telemetry.lastUpdate < 15000));

  // Determine displayed PI, accuracy, and counts dynamically prioritized for live webcam movement
  const displayPI = (isLive && telemetry.piScore !== undefined)
    ? Number(telemetry.piScore).toFixed(1)
    : (metrics.averagePerformanceIndex ? Number(metrics.averagePerformanceIndex).toFixed(1) : '86.5');

  const displayAccuracy = (isLive && telemetry.shotStats?.accuracyPercentage !== undefined && telemetry.shotStats.totalShots > 0)
    ? Math.round(telemetry.shotStats.accuracyPercentage)
    : (metrics.overallAccuracy !== undefined ? Math.round(metrics.overallAccuracy) : 80);

  const totalShotsCount = (isLive && telemetry.shotStats?.totalShots !== undefined && telemetry.shotStats.totalShots > 0)
    ? telemetry.shotStats.totalShots
    : (metrics.totalShots || 25);

  const totalMadeCount = (isLive && telemetry.shotStats?.madeShots !== undefined && telemetry.shotStats.totalShots > 0)
    ? telemetry.shotStats.madeShots
    : (metrics.totalMade || 20);

  const totalMissedCount = (totalShotsCount - totalMadeCount >= 0)
    ? (totalShotsCount - totalMadeCount)
    : (isLive ? (telemetry.shotStats?.missedShots || 0) : 5);

  const illegalCount = telemetry.isIllegalExtension ? 1 : (metrics.totalIllegalExtensions || 0);

  // Dynamic rolling window for live elbow flexion curve
  const [angleHistory, setAngleHistory] = React.useState([
    { frame: 't-7', angle: 140.0, delta: 3.0, limit: 15.0 },
    { frame: 't-6', angle: 145.0, delta: 4.0, limit: 15.0 },
    { frame: 't-5', angle: 150.0, delta: 5.5, limit: 15.0 },
    { frame: 't-4', angle: 155.0, delta: 7.0, limit: 15.0 },
    { frame: 't-3', angle: 158.0, delta: 6.0, limit: 15.0 },
    { frame: 't-2', angle: 160.0, delta: 5.0, limit: 15.0 },
    { frame: 't-1', angle: 159.0, delta: 5.5, limit: 15.0 },
    { frame: 'Live', angle: 158.4, delta: 6.5, limit: 15.0 },
  ]);

  React.useEffect(() => {
    if (telemetry?.elbowAngle !== undefined && telemetry.lastUpdate) {
      setAngleHistory(prev => {
        const next = [...prev.slice(1)];
        next.push({
          frame: `f${Math.floor(Date.now() / 250) % 100}`,
          angle: Number(telemetry.elbowAngle.toFixed(1)),
          delta: Number((telemetry.extensionDelta || 0).toFixed(1)),
          limit: 15.0
        });
        return next;
      });
    }
  }, [telemetry?.elbowAngle, telemetry?.extensionDelta, telemetry?.lastUpdate]);

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Performance Index (PI)"
          value={displayPI}
          subtitle="Multi-factor Kinematic Grade"
          icon={Award}
          color="cyan"
          badge={telemetry.grade || 'PRO'}
        />

        <MetricCard
          title="Shot Accuracy Ratio"
          value={displayAccuracy}
          unit="%"
          subtitle={`${totalMadeCount} Made / ${totalShotsCount} Total`}
          icon={Target}
          color="green"
          trend={+4.5}
        />

        <MetricCard
          title="Live Elbow Angle θ"
          value={telemetry.elbowAngle ? telemetry.elbowAngle.toFixed(1) : '158.4'}
          unit="°"
          subtitle={`Straightening Δ: ${telemetry.extensionDelta !== undefined ? telemetry.extensionDelta : 6.5}°`}
          icon={Activity}
          color={telemetry.isIllegalExtension ? 'red' : 'green'}
          badge={telemetry.isIllegalExtension ? 'ILLEGAL >15°' : 'OPTIMAL'}
        />

        <MetricCard
          title="Illegal Extensions"
          value={telemetry.isIllegalExtension ? '1 FLAGGED' : `${illegalCount} TOTAL`}
          subtitle="ICC / Rule Violations"
          icon={ShieldAlert}
          color={telemetry.isIllegalExtension ? 'red' : 'purple'}
          badge={telemetry.isIllegalExtension ? 'ACTIVE VIOLATION' : 'COMPLIANT'}
        />
      </div>

      {/* Main 2-Column Grid: Video Feed & Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Vision Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <LiveCameraFeed />
          <ElbowAngleChart
            data={angleHistory}
            currentAngle={telemetry.elbowAngle || 158.4}
            extensionDelta={telemetry.extensionDelta !== undefined ? telemetry.extensionDelta : 6.5}
            isIllegal={telemetry.isIllegalExtension}
            sportType={sportType}
          />
        </div>

        {/* Right Column: Gauges, Counters & Coaching (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <PerformanceIndexGauge
            score={Number(displayPI) || 86.5}
            grade={telemetry.grade || 'PRO'}
            accuracyScore={Number(displayAccuracy) || 80.0}
            elbowStabilityScore={telemetry.elbowStabilityScore || 88.5}
            kneeTimingScore={telemetry.kneeTimingScore || 92.0}
            illegalExtensions={illegalCount}
          />

          <ShotOutcomeCounter
            totalShots={totalShotsCount}
            madeShots={totalMadeCount}
            missedShots={totalMissedCount}
            accuracy={displayAccuracy}
            currentStreak={telemetry.shotStats?.currentStreak || 4}
            bestStreak={telemetry.shotStats?.bestStreak || 6}
            recentShots={dashboardData?.recentSessions?.[0]?.shots || []}
          />

          <CoachingFeedback insights={telemetry.coachingInsights} />
        </div>

      </div>

      {/* Lower Section: Full Kinetic Chain Velocity Propagation */}
      <div className="grid grid-cols-1 gap-6">
        <KinematicChainChart />
      </div>

    </div>
  );
};

export default Dashboard;
