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

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Performance Index (PI)"
          value={telemetry.piScore?.toFixed(1) || '86.5'}
          subtitle="Multi-factor Kinematic Grade"
          icon={Award}
          color="cyan"
          badge={telemetry.grade || 'PRO'}
        />

        <MetricCard
          title="Shot Accuracy Ratio"
          value={telemetry.shotStats?.accuracyPercentage?.toFixed(0) || '80'}
          unit="%"
          subtitle={`${telemetry.shotStats?.madeShots || 16} Made / ${telemetry.shotStats?.totalShots || 20} Total`}
          icon={Target}
          color="green"
          trend={+4.5}
        />

        <MetricCard
          title="Live Elbow Angle θ"
          value={telemetry.elbowAngle?.toFixed(1) || '158.4'}
          unit="°"
          subtitle={`Straightening Δ: ${telemetry.extensionDelta || 6.5}°`}
          icon={Activity}
          color={telemetry.isIllegalExtension ? 'red' : 'green'}
          badge={telemetry.isIllegalExtension ? 'ILLEGAL >15°' : 'OPTIMAL'}
        />

        <MetricCard
          title="Illegal Extensions"
          value={telemetry.isIllegalExtension ? '1 FLAGGED' : '0'}
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
            currentAngle={telemetry.elbowAngle || 158.4}
            extensionDelta={telemetry.extensionDelta || 6.5}
            isIllegal={telemetry.isIllegalExtension}
            sportType={sportType}
          />
        </div>

        {/* Right Column: Gauges, Counters & Coaching (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <PerformanceIndexGauge
            score={telemetry.piScore || 86.5}
            grade={telemetry.grade || 'PRO'}
            accuracyScore={telemetry.shotStats?.accuracyPercentage || 80.0}
            elbowStabilityScore={88.5}
            kneeTimingScore={92.0}
            illegalExtensions={telemetry.isIllegalExtension ? 1 : 0}
          />

          <ShotOutcomeCounter
            totalShots={telemetry.shotStats?.totalShots || 20}
            madeShots={telemetry.shotStats?.madeShots || 16}
            missedShots={telemetry.shotStats?.missedShots || 4}
            accuracy={telemetry.shotStats?.accuracyPercentage || 80.0}
            currentStreak={telemetry.shotStats?.currentStreak || 4}
            bestStreak={telemetry.shotStats?.bestStreak || 6}
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

