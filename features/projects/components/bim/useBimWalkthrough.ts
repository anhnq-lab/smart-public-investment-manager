/**
 * useBimWalkthrough — First-person walkthrough mode for BIM viewer
 * 
 * Activates a FPS-like navigation mode:
 * - WASD / Arrow keys for movement
 * - Mouse drag (left-click) for look around
 * - Q/E or Space/Shift for up/down
 * - Scroll to adjust movement speed
 * - Escape to exit walkthrough mode
 * 
 * Uses camera-controls library (behind OBC.SimpleCamera)
 * to switch between orbit and first-person modes.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as OBC from '@thatopen/components';

export interface WalkthroughAPI {
    /** Whether walkthrough mode is currently active */
    isActive: boolean;
    /** Enter walkthrough mode */
    enter: () => void;
    /** Exit walkthrough mode */
    exit: () => void;
    /** Toggle walkthrough mode */
    toggle: () => void;
    /** Current movement speed (m/frame) */
    speed: number;
    /** Set movement speed */
    setSpeed: (speed: number) => void;
}

interface WalkthroughOptions {
    worldRef: React.MutableRefObject<OBC.World | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_SPEED = 0.3;
const MIN_SPEED = 0.05;
const MAX_SPEED = 3.0;
const LOOK_SENSITIVITY = 0.003;

export function useBimWalkthrough({ worldRef, containerRef }: WalkthroughOptions): WalkthroughAPI {
    const [isActive, setIsActive] = useState(false);
    const [speed, setSpeed] = useState(DEFAULT_SPEED);
    const keysRef = useRef<Set<string>>(new Set());
    const rafRef = useRef<number>(0);
    const isLookingRef = useRef(false);
    const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const savedCameraStateRef = useRef<{ position: number[]; target: number[] } | null>(null);

    // Save/restore camera state for orbit mode
    const saveCameraState = useCallback(() => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;
        const controls = camera.controls;
        const pos = controls.getPosition(null as any);
        const tgt = controls.getTarget(null as any);
        savedCameraStateRef.current = {
            position: [pos.x, pos.y, pos.z],
            target: [tgt.x, tgt.y, tgt.z],
        };
    }, [worldRef]);

    // Enter walkthrough mode
    const enter = useCallback(() => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;

        saveCameraState();

        const controls = camera.controls;
        // Store the camera close to the model at eye height
        const pos = controls.getPosition(null as any);
        const tgt = controls.getTarget(null as any);

        // Calculate forward direction
        const dx = tgt.x - pos.x;
        const dy = tgt.y - pos.y;
        const dz = tgt.z - pos.z;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Set target about 2m ahead of camera (or use current if already close)
        const dist = Math.min(len, 2);
        controls.setTarget(
            pos.x + (dx / len) * dist,
            pos.y,
            pos.z + (dz / len) * dist,
            false
        );

        // Disable orbit rotation, enable truck (for walk-through style controls)
        controls.minDistance = 0.01;
        controls.maxDistance = 0.01;

        setIsActive(true);
    }, [worldRef, saveCameraState]);

    // Exit walkthrough mode
    const exit = useCallback(() => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;

        const controls = camera.controls;
        controls.minDistance = 0;
        controls.maxDistance = Infinity;

        // Restore previous camera state
        if (savedCameraStateRef.current) {
            const s = savedCameraStateRef.current;
            controls.setLookAt(
                s.position[0], s.position[1], s.position[2],
                s.target[0], s.target[1], s.target[2],
                true
            );
        }

        keysRef.current.clear();
        setIsActive(false);
    }, [worldRef]);

    const toggle = useCallback(() => {
        if (isActive) exit();
        else enter();
    }, [isActive, enter, exit]);

    // Movement animation loop
    useEffect(() => {
        if (!isActive) return;

        const animate = () => {
            const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
            if (!camera) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }

            const controls = camera.controls;
            const keys = keysRef.current;

            // Forward/backward
            if (keys.has('KeyW') || keys.has('ArrowUp')) controls.forward(speed, true);
            if (keys.has('KeyS') || keys.has('ArrowDown')) controls.forward(-speed, true);

            // Strafe left/right
            if (keys.has('KeyA') || keys.has('ArrowLeft')) controls.truck(-speed, 0, true);
            if (keys.has('KeyD') || keys.has('ArrowRight')) controls.truck(speed, 0, true);

            // Up/down
            if (keys.has('Space') || keys.has('KeyE')) controls.truck(0, -speed, true);
            if (keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyQ')) controls.truck(0, speed, true);

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [isActive, speed, worldRef]);

    // Keyboard handlers
    useEffect(() => {
        if (!isActive) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (e.code === 'Escape') {
                exit();
                return;
            }
            e.preventDefault();
            keysRef.current.add(e.code);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            keysRef.current.delete(e.code);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            keysRef.current.clear();
        };
    }, [isActive, exit]);

    // Mouse look handlers
    useEffect(() => {
        if (!isActive) return;
        const container = containerRef.current;
        if (!container) return;

        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return; // Only left-click
            isLookingRef.current = true;
            prevMouseRef.current = { x: e.clientX, y: e.clientY };
            container.style.cursor = 'none';
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isLookingRef.current) return;

            const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
            if (!camera) return;

            const dx = e.clientX - prevMouseRef.current.x;
            const dy = e.clientY - prevMouseRef.current.y;
            prevMouseRef.current = { x: e.clientX, y: e.clientY };

            // Rotate camera (azimuth, polar)
            camera.controls.rotate(-dx * LOOK_SENSITIVITY, -dy * LOOK_SENSITIVITY, true);
        };

        const onMouseUp = () => {
            isLookingRef.current = false;
            container.style.cursor = 'crosshair';
        };

        // Scroll to adjust speed
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            setSpeed(prev => {
                const factor = e.deltaY > 0 ? 0.85 : 1.15;
                return Math.max(MIN_SPEED, Math.min(MAX_SPEED, prev * factor));
            });
        };

        container.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        container.addEventListener('wheel', onWheel, { passive: false });

        // Set crosshair cursor while in walkthrough
        container.style.cursor = 'crosshair';

        return () => {
            container.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            container.removeEventListener('wheel', onWheel);
            container.style.cursor = '';
        };
    }, [isActive, worldRef, containerRef]);

    return { isActive, enter, exit, toggle, speed, setSpeed };
}
