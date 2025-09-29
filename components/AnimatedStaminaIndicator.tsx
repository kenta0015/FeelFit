import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop, type CircleProps } from 'react-native-svg';

interface AnimatedStaminaIndicatorProps {
  stamina: number;
  level: string;
  color: string;
  progress: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AnimatedStaminaIndicator({
  stamina,
  level,
  color,
  progress,
}: AnimatedStaminaIndicatorProps) {
  const animatedProgress = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const glowAnimation = useSharedValue(0);

  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Animate progress circle
    animatedProgress.value = withTiming(progress / 100, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });

    // Pulse animation for the center
    pulseAnimation.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );

    // Glow effect
    glowAnimation.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, [progress]);

  // 🔧 Animate SVG via props (NOT style) – works on native + web
  const animatedCircleProps = useAnimatedProps<Partial<CircleProps>>(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset: Number.isFinite(strokeDashoffset) ? strokeDashoffset : 0,
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 1], [0.3, 0.8]);
    return { opacity };
  });

  const particlePositions = [
    { x: 20, y: 30, delay: 0 },
    { x: 140, y: 25, delay: 500 },
    { x: 160, y: 80, delay: 1000 },
    { x: 130, y: 135, delay: 1500 },
    { x: 30, y: 140, delay: 2000 },
    { x: 10, y: 85, delay: 2500 },
  ];

  return (
    <View style={styles.container}>
      {/* Floating Particles */}
      {particlePositions.map((pos, index) => (
        <FloatingParticle key={index} x={pos.x} y={pos.y} delay={pos.delay} color={color} />
      ))}

      {/* Main Circle with SVG */}
      <View style={styles.circleContainer}>
        <Svg width={200} height={200} style={styles.svg}>
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>

          {/* Background Circle */}
          <Circle cx="100" cy="100" r={radius} stroke="#f3f4f6" strokeWidth={strokeWidth} fill="none" />

          {/* Animated Progress Circle */}
          <AnimatedCircle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedCircleProps}   // 👈 use animatedProps
            transform={'rotate(-90 100 100)'}
          />
        </Svg>

        {/* Glow Effect */}
        <Animated.View style={[styles.glowEffect, { backgroundColor: color }, glowStyle]} />

        {/* Center Content */}
        <Animated.View style={[styles.centerContent, pulseStyle]}>
          <Text style={styles.staminaValue}>{stamina}</Text>
          <Text style={styles.staminaLabel}>Stamina</Text>
          <Text style={[styles.levelText, { color }]}>{level}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

interface FloatingParticleProps {
  x: number;
  y: number;
  delay: number;
  color: string;
}

function FloatingParticle({ x, y, delay, color }: FloatingParticleProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withRepeat(
        withSequence(withTiming(-20, { duration: 2000 }), withTiming(0, { duration: 2000 })),
        -1,
        true
      );

      opacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 1000 }), withTiming(0.2, { duration: 1000 })),
        -1,
        true
      );
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    position: 'relative',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.2,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  staminaValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  staminaLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
