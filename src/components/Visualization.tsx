import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface ParticleProps {
  id: string;
  delay: number;
  duration: number;
  color: string;
  size: number;
  startX: number;
  startY: number;
}

const Particle = ({ id, delay, duration, color, size, startX, startY }: ParticleProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue, delay, duration]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          transform: [{ translateY }, { scale }],
          opacity: opacity,
        },
      ]}
    >
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient
            id={`grad-${id}`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#grad-${id})`} />
      </Svg>
    </Animated.View>
  );
};

export const Visualization = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const color = isDarkMode ? '#4A3AFF' : '#00F2FE';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Particle id="1" delay={0} duration={3000} color={color} size={300} startX={-100} startY={height * 0.2} />
      <Particle id="2" delay={800} duration={4000} color={color} size={200} startX={width * 0.7} startY={height * 0.05} />
      <Particle id="3" delay={1500} duration={5000} color={color} size={250} startX={width * 0.1} startY={height * 0.5} />
      <Particle id="4" delay={500} duration={3500} color={color} size={150} startX={width * 0.7} startY={height * 0.7} />
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
