/**
 * useBimKeyboard — Professional keyboard navigation for BIM viewer
 * 
 * Shortcuts (always active when BIM container is focused):
 * ┌────────────────────────────────────────────────────┐
 * │ WASD / Arrows — Orbit camera (rotate around model) │
 * │ Q / E          — Roll camera left / right           │
 * │ +/- (=)        — Zoom in / out                      │
 * │ F / Home       — Fit all (zoom to extents)          │
 * │ 1-7            — Preset views                       │
 * │ Escape         — Cancel tool / deselect             │
 * │ Delete/Backsp  — Delete clip plane                  │
 * │ Shift + drag   — Pan (handled by camera-controls)   │
 * └────────────────────────────────────────────────────┘
 */
import { useEffect, useRef, useCallback } from 'react';
import * as OBC from '@thatopen/components';

// Orbit speed: degrees per key press (per animation frame)
const ORBIT_SPEED = 2.0;    // degrees
const PAN_SPEED = 0.5;      // units
const ZOOM_SPEED = 0.92;    // zoom factor per frame

interface UseBimKeyboardOptions {
    containerRef: React.RefObject<HTMLDivElement | null>;
    worldRef: React.MutableRefObject<OBC.World | null>;
    setView: (view: string) => void;
    fitAll: () => void;
    activateTool: (tool: string) => void;
    onEscape?: () => void;
}

export function useBimKeyboard({
    containerRef,
    worldRef,
    setView,
    fitAll,
    activateTool,
    onEscape,
}: UseBimKeyboardOptions) {
    const keysPressed = useRef<Set<string>>(new Set());
    const animFrameRef = useRef<number>(0);

    // ── Continuous orbit/pan/zoom based on held keys ──
    const animate = useCallback(() => {
        const world = worldRef.current;
        const camera = world?.camera as OBC.SimpleCamera | undefined;
        if (!camera) {
            animFrameRef.current = requestAnimationFrame(animate);
            return;
        }

        const controls = camera.controls;
        const keys = keysPressed.current;

        if (keys.size === 0) {
            animFrameRef.current = requestAnimationFrame(animate);
            return;
        }

        const deg2rad = Math.PI / 180;
        const shiftHeld = keys.has('ShiftLeft') || keys.has('ShiftRight');

        if (shiftHeld) {
            // ── Pan (Shift + WASD/Arrows) — truck the camera ──
            let truckX = 0;
            let truckY = 0;
            if (keys.has('KeyA') || keys.has('ArrowLeft')) truckX += PAN_SPEED;
            if (keys.has('KeyD') || keys.has('ArrowRight')) truckX -= PAN_SPEED;
            if (keys.has('KeyW') || keys.has('ArrowUp')) truckY += PAN_SPEED;
            if (keys.has('KeyS') || keys.has('ArrowDown')) truckY -= PAN_SPEED;
            if (truckX !== 0 || truckY !== 0) {
                controls.truck(truckX, truckY, true);
            }
        } else {
            // ── Orbit (WASD or Arrow keys) ──
            let azimuth = 0;
            let polar = 0;

            if (keys.has('KeyA') || keys.has('ArrowLeft')) azimuth += ORBIT_SPEED * deg2rad;
            if (keys.has('KeyD') || keys.has('ArrowRight')) azimuth -= ORBIT_SPEED * deg2rad;
            if (keys.has('KeyW') || keys.has('ArrowUp')) polar += ORBIT_SPEED * deg2rad;
            if (keys.has('KeyS') || keys.has('ArrowDown')) polar -= ORBIT_SPEED * deg2rad;

            if (azimuth !== 0 || polar !== 0) {
                controls.rotate(azimuth, polar, true);
            }
        }

        // ── Roll (Q / E) ──
        if (keys.has('KeyQ')) {
            controls.rotate(ORBIT_SPEED * deg2rad * 0.5, 0, true);
        }
        if (keys.has('KeyE')) {
            controls.rotate(-ORBIT_SPEED * deg2rad * 0.5, 0, true);
        }

        // ── Zoom (+/-) ──
        if (keys.has('Equal') || keys.has('NumpadAdd')) {
            controls.dolly(1 / ZOOM_SPEED, true);
        }
        if (keys.has('Minus') || keys.has('NumpadSubtract')) {
            controls.dolly(ZOOM_SPEED, true);
        }

        animFrameRef.current = requestAnimationFrame(animate);
    }, [worldRef]);

    // ── Key event handlers ──
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Make container focusable
        if (!container.getAttribute('tabindex')) {
            container.setAttribute('tabindex', '0');
            container.style.outline = 'none';
        }

        const onKeyDown = (e: KeyboardEvent) => {
            // Skip if typing in an input
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            const code = e.code;

            // ── Single-press shortcuts ──
            switch (code) {
                case 'Escape':
                    activateTool('select');
                    onEscape?.();
                    return;
                case 'KeyF':
                case 'Home':
                    e.preventDefault();
                    fitAll();
                    return;
                // Numpad/number preset views
                case 'Digit1': case 'Numpad1':
                    e.preventDefault();
                    setView('front');
                    return;
                case 'Digit2': case 'Numpad2':
                    e.preventDefault();
                    setView('back');
                    return;
                case 'Digit3': case 'Numpad3':
                    e.preventDefault();
                    setView('left');
                    return;
                case 'Digit4': case 'Numpad4':
                    e.preventDefault();
                    setView('right');
                    return;
                case 'Digit5': case 'Numpad5':
                    e.preventDefault();
                    setView('top');
                    return;
                case 'Digit6': case 'Numpad6':
                    e.preventDefault();
                    setView('bottom');
                    return;
                case 'Digit7': case 'Numpad7':
                    e.preventDefault();
                    setView('iso');
                    return;
            }

            // ── Continuous keys (WASD, arrows, Q, E, +, -) ──
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract',
                'ShiftLeft', 'ShiftRight'].includes(code)) {
                e.preventDefault();
                keysPressed.current.add(code);
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.code);
        };

        // Focus container when mouse enters so keyboard works
        const onMouseEnter = () => {
            container.focus();
        };

        const onBlur = () => {
            keysPressed.current.clear();
        };

        container.addEventListener('keydown', onKeyDown);
        container.addEventListener('keyup', onKeyUp);
        container.addEventListener('mouseenter', onMouseEnter);
        container.addEventListener('blur', onBlur);

        // Start animation loop
        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            container.removeEventListener('keydown', onKeyDown);
            container.removeEventListener('keyup', onKeyUp);
            container.removeEventListener('mouseenter', onMouseEnter);
            container.removeEventListener('blur', onBlur);
            cancelAnimationFrame(animFrameRef.current);
            keysPressed.current.clear();
        };
    }, [containerRef, animate, setView, fitAll, activateTool, onEscape]);
}
