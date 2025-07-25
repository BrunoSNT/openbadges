import { Quaternion, Vector3 } from '@dcl/sdk/math'
import * as npc from 'dcl-npc-toolkit'
import { MeshCollider, ColliderLayer, engine, Transform, Entity } from '@dcl/sdk/ecs'
import { executeTask } from '@dcl/sdk/ecs'
import { AchievementCreationDialog, startAchievementDialog, cleanupDialogState, startSimpleAchievementDialog } from '../dialogs/achievement-dialogs'

console.log('🔧 Creating computer NPC...')

export let computerNpc: Entity

// Function to create the computer NPC
export function createComputerNpc() {
  computerNpc = npc.create(
    // TransformType
    {
      position: Vector3.create(156.23, 20.0, 168.3),
      rotation: Quaternion.Zero(),
      scale: Vector3.create(0.8, 0.8, 0.8)
    },
    // NPCData Object
    {
      type: npc.NPCType.CUSTOM,
      model: 'assets/builder/computer/computer.glb',
      portrait: { path: 'assets/images/imagepc.png', height: 260, width: 260, offsetX: -20, offsetY: +20 },
      onActivate: () => {
        console.log("🖥️ Computer NPC activated!")
        try {
          // Using the new simple dialog system
          startSimpleAchievementDialog()
        } catch (error) {
          console.error('❌ Error starting achievement dialog:', error)
        }
      },
      onlyETrigger: true,
      hoverText: "CREDENCIAMENTO",
      reactDistance: 3,
      faceUser: false
    }
  )

  console.log('✅ Computer NPC created:', computerNpc)

  // Add manual collision detection to ensure interaction works
  try {
    MeshCollider.setBox(computerNpc, ColliderLayer.CL_POINTER)
    console.log('✅ Computer NPC collision set')
  } catch (error) {
    console.error('❌ Error setting computer NPC collision:', error)
  }
}

// Call the function to create the NPC
createComputerNpc()
