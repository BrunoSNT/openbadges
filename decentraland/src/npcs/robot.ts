import { Quaternion, Vector3 } from '@dcl/sdk/math'
import * as npc from 'dcl-npc-toolkit'
import { RobozinDialog } from '../dialogs/dialogs'
import { MeshCollider, ColliderLayer } from '@dcl/sdk/ecs'
import { executeTask } from '@dcl/sdk/ecs';

export let robotNpc = npc.create(
  {
    position: Vector3.create(155.70, 18.55, 176.25), // next to cat
    rotation: Quaternion.Zero(),
    scale: Vector3.create(1, 1, 1) // Made bigger for easier interaction
  },
  {
    type: npc.NPCType.CUSTOM,
    model: 'assets/builder/robot/robot.glb',
    onActivate: () => npc.talk(robotNpc, RobozinDialog, 0),
    onlyETrigger: true,
    reactDistance: 8, // Increased interaction distance
    faceUser: true,
    hoverText: "INTERAGIR",
    walkingAnim: 'Walking',
    idleAnim: 'Idle',
    onWalkAway: () => {
      console.log('🤖 Player walked away from Robozin')
      // Resume walking after the dialog is closed
      npc.followPath(robotNpc, {
        path: robozinCirclePath,
        loop: true,
        totalDuration: 24
      });
    }
  }
)

console.log('✅ Robozin NPC created:', robotNpc)

try {
  MeshCollider.setBox(robotNpc, ColliderLayer.CL_POINTER)
  console.log('✅ Robozin NPC collision set')
} catch (error) {
  console.error('❌ Error setting Robozin NPC collision:', error)
}

// Make Robozin walk in circles
const center = Vector3.create(155.70, 18.55, 176.25)
const radius = 2.5
const steps = 8

function getCirclePoint(step: number): Vector3 {
  const angle = (2 * Math.PI * step) / steps
  return Vector3.create(
    center.x + radius * Math.cos(angle),
    center.y,
    center.z + radius * Math.sin(angle)
  )
}

// Build circular path for Robozin
const robozinCirclePath: Vector3[] = [];
for (let i = 0; i < steps; i++) {
  robozinCirclePath.push(getCirclePoint(i));
}

// Start the robot walking in circles
executeTask(async () => {
  npc.followPath(robotNpc, {
    path: robozinCirclePath,
    loop: true,
    totalDuration: 24 // 3 seconds per step * 8 steps
  });
});
