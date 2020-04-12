const ChatRecords = require('../models/chatRecords')
const Apply = require('../models/apply')
const Users = require('../models/users')
const Friends = require('../models/friends')
const Circles = require('../models/circles')
const mongoose = require('mongoose')
const userSocketMap = {}
let onlineCounts = 0
const chatRoom = []


module.exports = (io) => {
  io.on('connection', (socket) => {
    const socketId = socket.id
    let OPENID
    socket.on('login', async (openId, cb) => {
      OPENID = openId
      if(userSocketMap[openId]) {
        userSocketMap[openId].socket.disconnect(true)
      }
      userSocketMap[openId] = {socketId, socket}
      const data = await Users.findOneAndUpdate({openId}, {
        $set: {
          isOnline: true
        }
      }).exec()
      socket.broadcast.emit('online', data._doc.nickName)
      onlineCounts++
      cb && cb({ code: 200, msg: 'Login Success'})// 已登录
    })

    socket.on('applyFriend', async (params, cb) => {
      const fromId = params.openId
      const toId = params.fromId
      const fromUser = await Users.findOne({"openId": fromId})
      const toUser = await Users.findOne({"openId": toId})
      const fromApplyRecord = await Apply.findOne({fromId: fromUser._id, toId: toUser._id}).sort({updatedAt: -1})
      if (fromApplyRecord && fromApplyRecord.status === 1) {
        cb && cb({
          msg: '你已申请添加,请耐心等待通过'
        })
        return
      }
      const toApplyRecord = await Apply.findOne({fromId: toUser._id, toId: fromUser._id}).sort({updatedAt: -1})
      if (toApplyRecord && toApplyRecord.status === 1) {
        cb && cb({
          msg: '你已被申请，请前往记录详情查看'
        })
        return
      }
      const isFriend = await Friends.findOne({fromId: fromUser._id, toId: toUser._id}).exec()
      if (isFriend) {
        cb && cb({
          msg: '你们已经是好友'
        })
        return
      } 
      const apply = new Apply({
        fromId: mongoose.Types.ObjectId(fromUser._id),
        toId: mongoose.Types.ObjectId(toUser._id),
        applyRemark: params.applyRemark
      })
      const saveData = await apply.save()
      const data = await Apply.findOne({
        _id: saveData._id
      }).populate('fromId toId')
      userSocketMap[toId] && userSocketMap[toId].socketId && io.to(userSocketMap[toId].socketId).emit('receiveApplyFriend', data)
      cb && cb({
        data,
        msg: '申请成功'
      })
    })

    socket.on('agreeApplyFriend', async (params, cb) => {
      const { fromId, toId, _id } = params
      await Apply.findByIdAndUpdate(_id, {
        $set: {
          status: 2,
          updatedAt: Date.now()
        }
      }).exec()
      const fromUser = await Users.findOne({openId: fromId}).exec()
      const user = await Users.findOne({openId: toId}).exec()
      const friend1 = new Friends({ fromId: mongoose.Types.ObjectId(fromUser._id), toId: mongoose.Types.ObjectId(user._id) })
      const friend2 = new Friends({ fromId: mongoose.Types.ObjectId(user._id), toId: mongoose.Types.ObjectId(fromUser._id) })
      await friend1.save()
      await friend2.save()
      userSocketMap[fromId] && userSocketMap[fromId].socketId && io.to(userSocketMap[fromId].socketId).emit('receiveAgreeApplyFriend', {...user._doc, isFriend: true})
      cb && cb({
        data: {...fromUser._doc, isFriend: true},
        msg: '同意好友添加申请'
      })
    })

    socket.on('deleteFriend', async (params, cb) => {
      try {
        const { fromId, toId } = params
        const fromUser = await Users.findOne({ openId: fromId }).exec()
        const toUser = await Users.findOne({ openId: toId }).exec()
        await Friends.deleteMany({
          $or: [{fromId: fromUser._id, toId: toUser._id}, {fromId: toUser._id, toId: fromUser._id}]
        })
        await ChatRecords.deleteMany({
          $or: [{fromId: fromUser._id, toId: toUser._id}, {fromId: toUser._id, toId: fromUser._id}]
        })
       const apply = await Apply.findOne({
          $or: [{fromId: fromUser._id, toId: toUser._id}, {fromId: toUser._id, toId: fromUser._id}]
        }).sort({updatedAt: -1}).limit(1)
        await Apply.updateOne({_id: apply._id}, { $set: {status: 4} })
        userSocketMap[toId] && userSocketMap[toId].socketId && io.to(userSocketMap[toId].socketId).emit('receiveDeleteFriend', fromId)
        cb && cb({
          toId,
          msg: '删除好友成功'
        })
      } catch (error) {
        cb && cb({
          code: 500,
          msg: error.toString()
        })
      }
    })

    socket.on('sendMessage', async (params, cb) => {
      const { fromId, toId } = params
      const fromUser = await Users.findOne({openId: fromId}).exec()
      const toUser = await Users.findOne({openId: toId}).exec()
      const chatRecord = new ChatRecords({
        fromId: mongoose.Types.ObjectId(fromUser._id),
        toId: mongoose.Types.ObjectId(toUser._id),
        msgBody: params.msgBody
      })
      const message = await chatRecord.save()
      const data = await ChatRecords.findById(message._id, {__v: 0}).populate({path: 'fromId toId', select: '-__v'}).exec()
      userSocketMap[params.toId] && userSocketMap[params.toId].socketId && io.to(userSocketMap[params.toId].socketId).emit('receiveMessage', data)
      cb && cb(data)
    })

    socket.on('joinChatRoom', async (params, cb) => {
      const fromUser = await Users.findOne({openId: OPENID}, {__v: 0}).exec()
      const index = chatRoom.findIndex(item => item.openId === OPENID)
      index === -1 && chatRoom.push(fromUser)
      chatRoom.forEach(item => {
        if (item.openId !== OPENID) {
          userSocketMap[item.openId] && userSocketMap[item.openId].socketId && io.to(userSocketMap[item.openId].socketId).emit('receiveJoinChatRoom', {data: fromUser, total: chatRoom.length, createAt: Date.now()})
        }
      })
      cb && cb({data: fromUser, total: chatRoom.length, createAt: Date.now()})
    })

    socket.on('sendChatRoomMessage', async (params, cb) => {
      const { fromId } = params
      const fromUser = await Users.findOne({openId: fromId}, {__v: 0}).exec()
      const chatRecord = {
        fromId: fromUser,
        msgBody: params.msgBody,
        createAt: Date.now()
      }
      chatRoom.forEach(item => {
        userSocketMap[item.openId] && userSocketMap[item.openId].socketId && io.to(userSocketMap[item.openId].socketId).emit('receiveChatRoomMessage', chatRecord)
      })
      cb && cb(chatRecord)
    })

    socket.on('quitChatRoom', async (params, cb) => {
      const fromUser = await Users.findOne({openId: OPENID}, {__v: 0}).exec()
      const index = chatRoom.findIndex(item => item.openId === OPENID)
      index !== -1 && chatRoom.splice(index, 1)
      chatRoom.forEach(item => {
        userSocketMap[item.openId] && userSocketMap[item.openId].socketId && io.to(userSocketMap[item.openId].socketId).emit('receiveQuitChatRoom', {data: fromUser, total: chatRoom.length, createAt: Date.now()})
      })
      cb && cb({data: fromUser, total: chatRoom.length, createAt: Date.now()})
    })

    socket.on('sendCircle', async(params, cb) => {
      const { fromId } = params
      const user = await Users.findOne({openId: fromId}).exec()
      const circle = new Circles({
        ...params,
        fromId: user._id
      })
      await circle.save()
      const friendList = await Friends.find({fromId: user._id}).populate({path: 'toId'}).exec()
      friendList.forEach(item => {
        userSocketMap[item.toId.openId] && userSocketMap[item.toId.openId].socketId && io.to(userSocketMap[item.toId.openId].socketId).emit('receiveSendCircle', circle)
      })
      cb && cb({
        code: 200,
        msg: '发送成功'
      })
    })

    socket.on('likeCircle', async (params, cb) => {
      const { circleId, status } = params // 0取消点赞 1点赞
      const user = await Users.findOne({ openId: OPENID }).exec()
      let circle
      if (status) {
        circle = await Circles.findByIdAndUpdate(circleId, {
          $addToSet: {
            like: {
              fromId: OPENID,
              nickName: user.nickName
            }
          }
        }).populate({path: 'fromId'}).exec() 
      } else {
        circle = await Circles.findByIdAndUpdate(circleId, {
          $pull: {
            like: {
              fromId: OPENID,
              nickName: user.nickName
            }
          }
        }).populate({path: 'fromId'}).exec()
      }
      circle.fromId.openId !== OPENID && userSocketMap[circle.fromId.openId] && userSocketMap[circle.fromId.openId].socketId && io.to(userSocketMap[circle.fromId.openId].socketId).emit('receiveLikeCircle', {
        fromId: OPENID,
        nickName: user.nickName
      })
      cb && cb({
        code: 200,
        data: {
          fromId: OPENID,
          nickName: user.nickName
        }
      })
    })

    socket.on('replyCircle', async (params, cb) => {
      const user = await Users.findOne({ openId: OPENID }).exec()
      let toUser = {nickName: ''}
      if (params.toId) toUser = await Users.findOne({ openId: params.toId }).exec()
      const newCircleReply = {
        fromId: OPENID,
        fromNickName: user.nickName,
        toId: params.toId,
        toNickName: toUser.nickName,
        content: params.content,
        createAt: Date.now()
      }
      const circle = await Circles.findByIdAndUpdate(params.circleId, {
        $addToSet: {
          comments: newCircleReply
        }
      }).populate({path: 'fromId'}).exec()
      circle.fromId.openId !== OPENID && userSocketMap[circle.fromId.openId] && userSocketMap[circle.fromId.openId].socketId && io.to(userSocketMap[circle.fromId.openId].socketId).emit('receiveReplyCircle', newCircleReply)
      params.toId && userSocketMap[params.toId] && userSocketMap[params.toId].socketId && io.to(userSocketMap[params.toId].socketId).emit('receiveReplyCircle', newCircleReply)
      cb && cb({
        code: 200,
        data: {
          fromId: OPENID,
          fromNickName: user.nickName,
          toId: params.toId,
          toNickName: toUser.nickName,
          content: params.content,
          createAt: Date.now()
        }
      })
    })

    socket.on('disconnect', async (reason) => {
      let openId = ''
      for (const key in userSocketMap) {
        if (userSocketMap.hasOwnProperty(key)) {
          if(userSocketMap[key].socketId === socketId) {
            openId = key
            break
          }
        }
      }
      console.log('disconnect', reason, openId);
      const data = await Users.findOneAndUpdate({openId}, {
        $set: {
          isOnline: false
        }
      }).exec()
      const index = chatRoom.findIndex(item => item.openId === openId)
      if (index !== -1) {
        chatRoom.splice(index, 1)
        chatRoom.forEach(item => {
          userSocketMap[item.openId] && userSocketMap[item.openId].socketId && io.to(userSocketMap[item.openId].socketId).emit('receiveQuitChatRoom', {data,total: chatRoom.length})
        })
      }
      socket.broadcast.emit('offline', data.nickName)
      onlineCounts--
    })

    socket.on('error', (error) => {
      console.log('error', error);
    });

    setInterval(() => {
      socket.emit('onlineCounts', onlineCounts)
    }, 60000);
  })
} 