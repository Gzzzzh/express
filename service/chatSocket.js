const ChatRecords = require('../models/chatRecords')
const Apply = require('../models/apply')
const Users = require('../models/users')
const Friends = require('../models/friends')
const mongoose = require('mongoose')
const userSocketMap = {}
let onlineCounts = 0


module.exports = (io) => {
  io.on('connection', (socket) => {
    const socketId = socket.id
    socket.on('login', async (openId, cb) => {
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
      cb({ code: 200, msg: 'Login Success'})// 已登录
    })

    socket.on('applyFriend', async (params, cb) => {
      const fromId = params.openId
      const toId = params.fromId
      const fromUser = await Users.findOne({"openId": fromId})
      const toUser = await Users.findOne({"openId": toId})
      const fromApplyRecord = await Apply.findOne({fromId: fromUser._id, toId: toUser._id}).sort({updatedAt: -1})
      if (fromApplyRecord && fromApplyRecord.status === 1) {
        cb({
          msg: '你已申请添加,请耐心等待通过'
        })
        return
      }
      const toApplyRecord = await Apply.findOne({fromId: toUser._id, toId: fromUser._id})
      if (toApplyRecord && toApplyRecord.status === 1) {
        cb({
          msg: '你已被申请，请前往记录详情查看'
        })
        return
      }
      const isFriend = await Friends.findOne({fromId: fromUser._id, toId: toUser._id}).exec()
      if (isFriend) {
        cb({
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
      cb({
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
      cb({
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
        cb({
          toId,
          msg: '删除好友成功'
        })
      } catch (error) {
        cb({
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
      cb(data)
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
      socket.broadcast.emit('offline', data.nickName)
      onlineCounts--
    })

    socket.on('error', (error) => {
      console.log('error', error);
    });
  })
} 