import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export function Skeleton({
    width = '100%',
    height = 16,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const pulseAnim = useMemo(() => new Animated.Value(0.3), []);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 800,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ]),
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height, borderRadius, opacity: pulseAnim },
                style,
            ]}
        />
    );
}

export function CardSkeleton() {
    return (
        <View style={styles.card}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="100%" height={12} style={{ marginTop: 10 }} />
            <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
            <Skeleton width="85%" height={12} style={{ marginTop: 6 }} />
        </View>
    );
}

export function StepSkeleton() {
    return (
        <View style={styles.stepRow}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width="75%" height={14} style={{ marginLeft: 8 }} />
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: 'auto' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#e2e8f0',
    },
    card: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        marginBottom: 12,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
});
