import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from './ui';
import type { StepEvent } from '../services/agent/agent-api';

const KNOWN_NODE_LABELS: Record<string, string> = {
    parse_intent: '①',
    validate_policy: '②',
    plan_actions: '②',
    build_transaction: '③',
    tool_executor: '③',
    resolve_recipients: '③',
    policy_precheck: '④',
    multi_send_usdc: '⑤',
    simulate_tx: '⑥',
    assemble_tx: '⑦',
    synthesize_response: '⑧',
};

const ORDINAL_LABELS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

function getOrdinalLabel(order: number): string {
    if (order >= 1 && order <= ORDINAL_LABELS.length) {
        return ORDINAL_LABELS[order - 1];
    }

    return `${order}.`;
}

function getOrderFromPayload(payload: unknown): number | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const metadata = payload as { order?: unknown; stepIndex?: unknown };

    if (typeof metadata.order === 'number' && Number.isInteger(metadata.order) && metadata.order > 0) {
        return metadata.order;
    }

    if (
        typeof metadata.stepIndex === 'number' &&
        Number.isInteger(metadata.stepIndex) &&
        metadata.stepIndex >= 0
    ) {
        return metadata.stepIndex + 1;
    }

    return null;
}

interface StepCardProps {
    step: StepEvent;
    index: number;
}

export function StepCard({ step, index }: StepCardProps) {
    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const slideAnim = useMemo(() => new Animated.Value(20), []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, index, slideAnim]);

    const getStatusIcon = () => {
        switch (step.status) {
            case 'success':
                return '✓';
            case 'rejected':
                return '✗';
            case 'running':
                return '⟳';
            default:
                return '•';
        }
    };

    const getStatusColor = () => {
        switch (step.status) {
            case 'success':
                return '#22c55e';
            case 'rejected':
                return '#ef4444';
            case 'running':
                return '#3b82f6';
            default:
                return '#94a3b8';
        }
    };

    const getNodeLabel = () => {
        const knownLabel = KNOWN_NODE_LABELS[step.node || ''];
        if (knownLabel) {
            return knownLabel;
        }

        const order = getOrderFromPayload(step.payload);
        if (order !== null) {
            return getOrdinalLabel(order);
        }

        return '•';
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={styles.row}>
                <Text style={[styles.nodeLabel, { color: getStatusColor() }]}>
                    {getNodeLabel()}
                </Text>
                <Text style={styles.label} numberOfLines={2}>
                    {step.label}
                </Text>
                <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
                    {getStatusIcon()}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nodeLabel: {
        fontSize: 16,
        fontWeight: '600',
        width: 24,
        textAlign: 'center',
    },
    label: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
    },
    statusIcon: {
        fontSize: 18,
        fontWeight: '700',
        width: 24,
        textAlign: 'center',
    },
});
