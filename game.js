kaboom({
    global: true,
    fullscreen: true,
    scale: 2,
    debug: true,
    clearColor: [0, 0, 0, 1],
  })

//  speed identifiers 
const MOVE_SPEED = 120
const JUMP_FORCE= 360
const BIG_JUMP_FORCE = 550
let CURRENT_JUMP_FORCE = JUMP_FORCE
const FALL_DEATH = 400
const ENEMY_SPEED = 20


//  game logic 

// initilizaing the img with respective names 
//  level 1 images 
loadRoot('https://i.imgur.com/')
loadSprite('coin', 'wbKxhcd.png')
loadSprite('evil-shroom', 'KPO3fR9.png')
loadSprite('brick', 'pogC9x5.png')
loadSprite('block', 'M6rwarW.png')
loadSprite('mario', 'Wb1qfhK.png')
loadSprite('mushroom', '0wMd92p.png')
loadSprite('surprise', 'gesQ1KP.png')
loadSprite('unboxed', 'bdrLpi6.png')
loadSprite('pipe-top-left', 'ReTPiWY.png')
loadSprite('pipe-top-right', 'hj2GK4n.png')
loadSprite('pipe-bottom-left', 'c1cYSbt.png')
loadSprite('pipe-bottom-right', 'nqQ79eI.png')
  
//  level 2 images 
loadSprite('blue-block','fVscIbn.png') 
loadSprite('blue-brick','3e5YRQd.png') 
loadSprite('blue-steel','gqVoI2b.png') 
loadSprite('blue-evil-shroom','SvV4ueD.png') 
loadSprite('blue-surprise','RMqCc1G.png') 
  

scene("game", ({ level, score }) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    // layout for level 1
    const maps = [
      [
        '                                   ',
        '                                   ',
        '                                   ',
        '                                   ',
        '                                   ',
        '   %  =*=%=                        ',
        '                                   ',
        '                      -+           ',
        '                ^  ^  ()           ',
        '=========================  ========', 
      ],
    //    layout for level 2
      [
        '£                                        £',
        '£                                        £',
        '£                                        £',
        '£                                        £',
        '£                                        £',
        '£     @@@@@@                   X X       £',
        '£                            X X X       £',
        '£                          X X X X  X  -+£',
        '£               Z  Z     X X X X X  X  ()£',
        '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
      ]
    ]


    const levelCfg = {
        width: 20,
        height: 20,
        '=': [sprite('block'),solid()],
        '$': [sprite('coin'),'coin'],
        '%': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}': [sprite('unboxed'), solid()],
        '(': [sprite('pipe-bottom-left'),solid(),scale(0.5)],
        ')': [sprite('pipe-bottom-right'),solid(),scale(0.5)],
        '-': [sprite('pipe-top-left'),solid(),scale(0.5), 'pipe'],
        '+': [sprite('pipe-top-right'),solid(),scale(0.5),'pipe'],
        '^': [sprite('evil-shroom'),solid(), 'dangerous'],
        '#': [sprite('mushroom'),solid(), 'mushroom' , body()],
        //  level 2 
        '!': [sprite('blue-block'), solid(), scale(0.5)],
        '£': [sprite('blue-brick'), solid(), scale(0.5)],
        'Z': [sprite('blue-evil-shroom') , solid(), scale(0.5) ,'dangerous'],
        '@': [sprite('blue-surprise') , solid(), scale(0.5), 'coin-surprise'],
        'X': [ sprite('blue-steel'), solid() , scale(0.5)],

    }
    // adding all the levels 
    const gameLevel = addLevel(maps[level],levelCfg)
 
    // count of the score made by collecting the coins 
    const scoreLabel= add([
        text(score),
        pos(30,6),
        layer('ui'),
        {
            value:score,
        }
    ])

    //  pardeINT to change the level + 1 next level
    add([text('level'+ parseInt(level+1)), pos(40,6)])

    //  when mario takes the mushroom is gets big in size for some time
    function big(){
        let timer=0
        let isBig = false 
        return {
            update(){
                if(isBig){
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE // jump height increases
                    timer -= dt()
                    if(timer <= 0){ // when time ends 
                        this.smallify()
                    }
                }
            },
            isBig(){
                return isBig
            },
            smallify(){ // when time ends again becomes small
                this.scale= vec2(1)
                CURRENT_JUMP_FORCE = JUMP_FORCE // back to usual jump height 
                timer=0
                isBig = false
            },
            biggify(time){
                this.scale = vec2(2)
                timer= time
                isBig = true
            }
        }
    }

    const player = add([
        sprite('mario'),solid(),
        pos(30,0),
        body(),
        big(),
        origin('bot')
    ])

    //  movement of mario 
    action('mushroom',(m) => {
        m.move(20,0)
    })

    //  when mario hits head with the block coin comes out / mushroom comes out 
    // '$' coin   '}' unboxed
    player.on("headbump" , (obj) => {
        if(obj.is('coin-surprise')){
            gameLevel.spawn('$', obj.gridPos.sub(0,1))
            destroy(obj) // coin comes out and it becomes solid block 
            gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
        // '#' mushroom 
        if(obj.is('mushroom-surprise')){
            gameLevel.spawn('#', obj.gridPos.sub(0,1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
    })

    //  when mario touches the mushroom then the after effects are increase in height 
    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(6)
    })
    
    //  when mario touches the coin , score increases
    player.collides('coin',(c) => {
        destroy(c)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    // speed for the evilshroom 
    action('dangerous', (d) => {
        d.move(-ENEMY_SPEED,0)
    })

    //  when mario touch evil shroom 
    player.collides('dangerous',(d) => {
        if(isJumping){ // mario jumps kills evilshroom
            destroy(d)
        } else{ // not jump then game over score prints 
            go('lose' , { score: scoreLabel.value})
        }
    })

    // when mario falls down the floor 
    player.action(() => {
        camPos(player.pos)
        if(player.pos.y >= FALL_DEATH){
            go('lose' ,{ score: scoreLabel.value})
        }
    })

    //  when mario reaches the pipe 
    player.collides('pipe' ,() => {
        keyPress('down', () => { // down arrow key pressed next level enter 
            go('game', {
                level: (level+1) % maps.length, // next level
                score: scoreLabel.value // same score passed to next level
            })
        })
    })

    //  key to move back left 
    keyDown('left' ,() =>{
        player.move(-MOVE_SPEED,0)
    })

    //  key to move ahead right 
    keyDown('right', () => {
        player.move(MOVE_SPEED,0)
    })

    player.action(() => {
        if(player.grounded()){
            isJumping = false
        }
    })

    //  when space is pressed to jump 
    keyPress('space',() =>{
        if(player.grounded()){
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }
    })

})

scene('lose', ({score}) =>{
    add([text(score,32) , origin('center') , pos(width()/2 , height()/2 )])
})

start("game", {level: 0, score: 0})




  
 
  
