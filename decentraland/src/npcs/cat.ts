import { Quaternion, Vector3 } from '@dcl/sdk/math'
import * as npc from 'dcl-npc-toolkit'
import { FullDialog } from '../dialogs/dialogs'

console.log('🐱 Creating cat NPC...')

export let catNpc = npc.create(
  // TransformType
  {
    position: Vector3.create(163.70, 18.18, 192.25),
    rotation: Quaternion.Zero(),
    scale: Vector3.create(1, 1, 1)
  },
  // NPCData Object
  {
    type: npc.NPCType.CUSTOM,
    model: 'assets/builder/cat/black_cat.glb',
    onActivate: () => {
      console.log("🐱 Cat NPC activated!")
      npc.talk(catNpc, FullDialog, 0)
    },
    onlyETrigger: true,
    reactDistance: 6,
    faceUser: true,
    hoverText: "TALK"
  }
)

console.log('✅ Cat NPC created:', catNpc)
