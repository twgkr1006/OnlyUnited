import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// ─── 한국어 매핑 ────────────────────────────────────────────────────────────
const playerNameKoMap: Record<string, string> = {
  'Bruno Fernandes': '\ube0c\ub8e8\ub178 \ud398\ub974\ub09c\ub370\uc2a4',
  'Marcus Rashford': '\ub9c8\ucfec\uc2a4 \ub798\uc26c\ud3ec\ub4dc',
  'Harry Maguire': '\ud574\ub9ac \ub9c8\uacfc\uc774\uc5b4',
  'Victor Lindelof': '\ube45\ud130 \ub9b0\ub378\ub85c\ud504',
  'Luke Shaw': '\ub8e8\ud06c \uc1fc',
  'Diogo Dalot': '\ub514\uc624\uace0 \ub2ec\ub85c\ud2b8',
  'Casemiro': '\uce74\uc138\ubbf8\ub8e8',
  'Lisandro Martinez': '\ub9ac\uc0b0\ub4dc\ub85c \ub9c8\ub974\ud2f0\ub124\uc2a4',
  'Raphael Varane': '\ub77c\ud30c\uc5d8 \ubc14\ub780',
  'Antony': '\uc548\ud1a0\ub2c8',
  'Jadon Sancho': '\uc81c\uc774\ub374 \uc0b0\ucd08',
  'Mason Mount': '\uba54\uc774\uc2a8 \ub9c8\uc6b4\ud2b8',
  'Scott McTominay': '\uc2a4\ucbd3 \ub9e5\ud1a0\ubbf8\ub124\uc774',
  'Fred': '\ud504\ub808\ub4dc',
  'Andre Onana': '\uc559\ub4dc\ub808 \uc624\ub098\ub098',
  'Tom Heaton': '\ud1b0 \ud788\ud134',
  'Jonny Evans': '\uc870\ub2c8 \uc5d0\ubc10\uc2a4',
  'Willy Kambwala': '\uc78c\ub9ac \uce50\ube14\uc640\ub77c',
  'Altay Bayindir': '\uc54c\ud0c0\uc774 \ubca0\uc774\uc778\ub514\ub974',
  'Tyrell Malacia': '\ud2f0\ub80c \ub9d0\ub77c\uc2dc\uc544',
  'Facundo Pellistri': '\ud30c\ucfe8\ub3c4 \ud3d0\ub9ac\uc2a4\ud2b8\ub9ac',
  'Hannibal Mejbri': '\ud55c\ub2c8\ubc1c \uba54\uc9c0\ube0c\ub9ac',
  'Amad Diallo': '\uc544\ub9c8\ub4dc \ub514\uc54c\ub85c',
  'Alejandro Garnacho': '\uc54c\ub808\ud558\ub4dc\ub85c \uac00\ub974\ub098\ucd08',
  'Rasmus Hojlund': '\ub77c\uc2a4\ubb34\uc2a4 \ud76c\uc774\ub8ec\ub4dc',
  'Kobbie Mainoo': '\ucf54\ube44 \ub9c8\uc774\ub204',
  'Manuel Ugarte': '\ub9c8\ub204\uc5d8 \uc6b0\uac00\ub974\ud14c',
  'Leny Yoro': '\ub808\ub2c8 \uc694\ub85c',
  'Joshua Zirkzee': '\uc870\uc288\uc544 \uc9c0\ub974\ud06c\uc81c\uc774',
  'Noussair Mazraoui': '\ub204\uc0ac\uc774\ub974 \ub9c8\uc988\ub77c\uc704',
  'Patrick Dorgu': '\ud328\ud2b8\ub9ad \ub3c4\ub974\uad6c',
  'Mathys Tel': '\ub9c8\ud2f0\uc2a4 \ud154',
  'Harry Amass': '\ud574\ub9ac \uc544\ub9e4\uc2a4',
};

const nationalityKoMap: Record<string, string> = {
  'Portugal': '\ud3ec\ub974\ud22c\uac08', 'England': '\uc78a\uae00\ub79c\ub4dc',
  'Brazil': '\ube0c\ub77c\uc9c8', 'France': '\ud504\ub791\uc2a4',
  'Spain': '\uc2a4\ud398\uc778', 'Argentina': '\uc544\ub974\ud5e8\ud2f0\ub098',
  'Netherlands': '\ub124\ub35c\ub780\ub4dc', 'Sweden': '\uc2a4\uc6e8\ub374',
  'Uruguay': '\uc6b0\ub8e8\uacfc\uc774', 'Cameroon': '\uce74\uba54\ub8ec',
  'Germany': '\ub3c5\uc77c', 'Denmark': '\ub374\ub9c8\ud06c',
  'Nigeria': '\ub098\uc774\uc9c0\ub9ac\uc544', 'Ivory Coast': '\ucf54\ud2b8\ub514\ubd80\uc544\ub974',
  'Morocco': '\ubaa8\ub85c\ucf54', 'Senegal': '\uc138\ub124\uac08',
  'Mali': '\ub9d0\ub9ac', 'Guinea': '\uae30\ub2c8',
  'Belgium': '\ubca8\uae30\uc5d0', 'Italy': '\uc774\ud0c8\ub9ac\uc544',
  'Tunisia': '\ud280\ub2c8\uc9c0', 'Scotland': '\uc2a4\ucf54\ud2b8\ub79c\ub4dc',
  'Northern Ireland': '\ubd81\uc544\uc77c\ub79c\ub4dc', 'Turkey': '\ud29c\ub974\ud0a4\uc5d0',
  'Mexico': '\uba55\uc2dc\ucf54', 'Ecuador': '\uc5d0\ucfe0\uc544\ub3c4\ub974',
  'Colombia': '\ucf5c\ub86c\ube44\uc544', 'Norway': '\ub178\ub974\uc6e8\uc774',
  'Switzerland': '\uc2a4\uc704\uc2a4', 'Austria': '\uc624\uc2a4\ud2b8\ub9ac\uc544',
  'South Korea': '\ud55c\uad6d', 'Japan': '\uc77c\ubcf8',
};

const positionKoMap: Record<string, string> = {
  'Goalkeeper': '\uace8\ud0a4\ud37c', 'Defender': '\uc218\ube44\uc218',
  'Midfielder': '\ubbf8\ub4dc\ud544\ub354', 'Attacker': '\uacf5\uaca9\uc218', 'Forward': '\uacf5\uaca9\uc218',
};

// ─── 서브포지션 데이터 ─────────────────────────────────────────────────────────
const playerSubPositionMap: Record<string, string> = {
  'Bruno Fernandes': 'CAM', 'Marcus Rashford': 'LW',
  'Harry Maguire': 'CB', 'Victor Lindelof': 'CB',
  'Luke Shaw': 'LB', 'Diogo Dalot': 'RB',
  'Casemiro': 'CDM', 'Lisandro Martinez': 'LCB',
  'Raphael Varane': 'CB', 'Antony': 'RW',
  'Jadon Sancho': 'LW', 'Mason Mount': 'CAM',
  'Scott McTominay': 'CM', 'Fred': 'CDM',
  'Andre Onana': 'GK', 'Tom Heaton': 'GK',
  'Jonny Evans': 'CB', 'Willy Kambwala': 'CB',
  'Altay Bayindir': 'GK', 'Tyrell Malacia': 'LB',
  'Facundo Pellistri': 'RW', 'Hannibal Mejbri': 'CM',
  'Amad Diallo': 'RW', 'Alejandro Garnacho': 'LW',
  'Rasmus Hojlund': 'ST', 'Kobbie Mainoo': 'CM',
  'Manuel Ugarte': 'CDM', 'Leny Yoro': 'CB',
  'Joshua Zirkzee': 'CF', 'Noussair Mazraoui': 'RB',
  'Patrick Dorgu': 'LWB', 'Mathys Tel': 'RW',
  'Harry Amass': 'LB',
};

const subPositionLabel: Record<string, string> = {
  'GK': '\uace8\ud0a4\ud37c', 'CB': '\uc13c\ud130\ubc31',
  'LCB': '\ub808\ud504\ud2b8 \uc13c\ud130\ubc31', 'RCB': '\ub77c\uc774\ud2b8 \uc13c\ud130\ubc31',
  'LB': '\ub808\ud504\ud2b8 \ubc31', 'RB': '\ub77c\uc774\ud2b8 \ubc31',
  'LWB': '\ub808\ud504\ud2b8 \uc719\ubc31', 'RWB': '\ub77c\uc774\ud2b8 \uc719\ubc31',
  'CDM': '\uc218\ube44\ud615 \ubbf8\ub4dc\ud544\ub354', 'CM': '\uc13c\ud130 \ubbf8\ub4dc\ud544\ub354',
  'CAM': '\uacf5\uaca9\ud615 \ubbf8\ub4dc\ud544\ub354', 'LW': '\ub808\ud504\ud2b8 \uc708\uac70',
  'RW': '\ub77c\uc774\ud2b8 \uc708\uac70', 'CF': '\uc13c\ud130 \ud3ec\uc6cc\ub4dc',
  'ST': '\uc2a4\ud2b8\ub77c\uc774\ucee4',
};

type HeatMode = 'activity' | 'attack' | 'defense';
interface Hotspot { x: number; y: number; intensity: number; radius: number; }
type HotspotSet = { activity: Hotspot[]; attack: Hotspot[]; defense: Hotspot[] };

const subPositionHotspots: Record<string, HotspotSet> = {
  GK: {
    activity: [
      { x: 50, y: 92, intensity: 1.0, radius: 13 },
      { x: 32, y: 86, intensity: 0.6, radius: 9 }, { x: 68, y: 86, intensity: 0.6, radius: 9 },
      { x: 50, y: 80, intensity: 0.35, radius: 8 },
    ],
    attack: [
      { x: 50, y: 88, intensity: 0.8, radius: 10 },
      { x: 35, y: 84, intensity: 0.5, radius: 8 }, { x: 65, y: 84, intensity: 0.5, radius: 8 },
    ],
    defense: [
      { x: 50, y: 95, intensity: 1.0, radius: 14 },
      { x: 33, y: 90, intensity: 0.75, radius: 11 }, { x: 67, y: 90, intensity: 0.75, radius: 11 },
      { x: 50, y: 84, intensity: 0.5, radius: 9 },
    ],
  },
  CB: {
    activity: [
      { x: 50, y: 76, intensity: 0.9, radius: 14 },
      { x: 36, y: 74, intensity: 0.75, radius: 12 }, { x: 64, y: 74, intensity: 0.75, radius: 12 },
      { x: 50, y: 63, intensity: 0.4, radius: 9 },
    ],
    attack: [
      { x: 50, y: 60, intensity: 0.55, radius: 11 },
      { x: 35, y: 70, intensity: 0.4, radius: 9 }, { x: 65, y: 70, intensity: 0.4, radius: 9 },
      { x: 50, y: 50, intensity: 0.25, radius: 7 },
    ],
    defense: [
      { x: 50, y: 80, intensity: 1.0, radius: 15 },
      { x: 35, y: 78, intensity: 0.85, radius: 13 }, { x: 65, y: 78, intensity: 0.85, radius: 13 },
      { x: 50, y: 90, intensity: 0.6, radius: 10 },
    ],
  },
  LCB: {
    activity: [
      { x: 30, y: 76, intensity: 0.95, radius: 14 },
      { x: 18, y: 79, intensity: 0.7, radius: 11 }, { x: 42, y: 72, intensity: 0.6, radius: 10 },
      { x: 28, y: 64, intensity: 0.38, radius: 8 },
    ],
    attack: [
      { x: 30, y: 62, intensity: 0.55, radius: 11 },
      { x: 22, y: 70, intensity: 0.4, radius: 9 }, { x: 38, y: 55, intensity: 0.3, radius: 8 },
    ],
    defense: [
      { x: 30, y: 80, intensity: 1.0, radius: 14 },
      { x: 18, y: 83, intensity: 0.8, radius: 12 }, { x: 42, y: 78, intensity: 0.7, radius: 11 },
      { x: 30, y: 89, intensity: 0.5, radius: 9 },
    ],
  },
  RCB: {
    activity: [
      { x: 70, y: 76, intensity: 0.95, radius: 14 },
      { x: 82, y: 79, intensity: 0.7, radius: 11 }, { x: 58, y: 72, intensity: 0.6, radius: 10 },
    ],
    attack: [
      { x: 70, y: 62, intensity: 0.55, radius: 11 },
      { x: 78, y: 70, intensity: 0.4, radius: 9 }, { x: 62, y: 55, intensity: 0.3, radius: 8 },
    ],
    defense: [
      { x: 70, y: 80, intensity: 1.0, radius: 14 },
      { x: 82, y: 83, intensity: 0.8, radius: 12 }, { x: 58, y: 78, intensity: 0.7, radius: 11 },
      { x: 70, y: 89, intensity: 0.5, radius: 9 },
    ],
  },
  LB: {
    activity: [
      { x: 14, y: 68, intensity: 0.9, radius: 13 },
      { x: 16, y: 52, intensity: 0.8, radius: 12 }, { x: 13, y: 82, intensity: 0.65, radius: 10 },
      { x: 20, y: 38, intensity: 0.45, radius: 9 },
    ],
    attack: [
      { x: 14, y: 33, intensity: 0.75, radius: 13 },
      { x: 18, y: 20, intensity: 0.55, radius: 10 }, { x: 22, y: 44, intensity: 0.4, radius: 9 },
    ],
    defense: [
      { x: 13, y: 80, intensity: 1.0, radius: 14 },
      { x: 12, y: 68, intensity: 0.85, radius: 12 }, { x: 18, y: 74, intensity: 0.65, radius: 10 },
    ],
  },
  RB: {
    activity: [
      { x: 86, y: 68, intensity: 0.9, radius: 13 },
      { x: 84, y: 52, intensity: 0.8, radius: 12 }, { x: 87, y: 82, intensity: 0.65, radius: 10 },
      { x: 80, y: 38, intensity: 0.45, radius: 9 },
    ],
    attack: [
      { x: 86, y: 33, intensity: 0.75, radius: 13 },
      { x: 82, y: 20, intensity: 0.55, radius: 10 }, { x: 78, y: 44, intensity: 0.4, radius: 9 },
    ],
    defense: [
      { x: 87, y: 80, intensity: 1.0, radius: 14 },
      { x: 88, y: 68, intensity: 0.85, radius: 12 }, { x: 82, y: 74, intensity: 0.65, radius: 10 },
    ],
  },
  LWB: {
    activity: [
      { x: 14, y: 44, intensity: 0.9, radius: 14 },
      { x: 14, y: 63, intensity: 0.75, radius: 12 }, { x: 17, y: 28, intensity: 0.6, radius: 11 },
      { x: 20, y: 78, intensity: 0.45, radius: 9 },
    ],
    attack: [
      { x: 14, y: 25, intensity: 0.8, radius: 13 }, { x: 17, y: 14, intensity: 0.6, radius: 10 },
      { x: 22, y: 38, intensity: 0.45, radius: 9 },
    ],
    defense: [
      { x: 14, y: 72, intensity: 1.0, radius: 14 }, { x: 12, y: 62, intensity: 0.8, radius: 12 },
      { x: 20, y: 80, intensity: 0.65, radius: 10 },
    ],
  },
  RWB: {
    activity: [
      { x: 86, y: 44, intensity: 0.9, radius: 14 },
      { x: 86, y: 63, intensity: 0.75, radius: 12 }, { x: 83, y: 28, intensity: 0.6, radius: 11 },
      { x: 80, y: 78, intensity: 0.45, radius: 9 },
    ],
    attack: [
      { x: 86, y: 25, intensity: 0.8, radius: 13 }, { x: 83, y: 14, intensity: 0.6, radius: 10 },
      { x: 78, y: 38, intensity: 0.45, radius: 9 },
    ],
    defense: [
      { x: 86, y: 72, intensity: 1.0, radius: 14 }, { x: 88, y: 62, intensity: 0.8, radius: 12 },
      { x: 80, y: 80, intensity: 0.65, radius: 10 },
    ],
  },
  CDM: {
    activity: [
      { x: 50, y: 58, intensity: 0.95, radius: 15 },
      { x: 34, y: 60, intensity: 0.7, radius: 12 }, { x: 66, y: 60, intensity: 0.7, radius: 12 },
      { x: 50, y: 70, intensity: 0.5, radius: 10 }, { x: 50, y: 47, intensity: 0.4, radius: 9 },
    ],
    attack: [
      { x: 50, y: 50, intensity: 0.6, radius: 12 },
      { x: 35, y: 54, intensity: 0.45, radius: 10 }, { x: 65, y: 54, intensity: 0.45, radius: 10 },
    ],
    defense: [
      { x: 50, y: 63, intensity: 1.0, radius: 15 },
      { x: 34, y: 65, intensity: 0.8, radius: 13 }, { x: 66, y: 65, intensity: 0.8, radius: 13 },
      { x: 50, y: 73, intensity: 0.6, radius: 11 },
    ],
  },
  CM: {
    activity: [
      { x: 50, y: 50, intensity: 0.95, radius: 14 },
      { x: 34, y: 52, intensity: 0.7, radius: 12 }, { x: 66, y: 52, intensity: 0.7, radius: 12 },
      { x: 50, y: 65, intensity: 0.4, radius: 9 }, { x: 50, y: 36, intensity: 0.45, radius: 9 },
    ],
    attack: [
      { x: 50, y: 37, intensity: 0.75, radius: 13 },
      { x: 35, y: 40, intensity: 0.55, radius: 11 }, { x: 65, y: 40, intensity: 0.55, radius: 11 },
      { x: 50, y: 27, intensity: 0.4, radius: 9 },
    ],
    defense: [
      { x: 50, y: 57, intensity: 0.9, radius: 13 },
      { x: 35, y: 59, intensity: 0.7, radius: 11 }, { x: 65, y: 59, intensity: 0.7, radius: 11 },
    ],
  },
  CAM: {
    activity: [
      { x: 50, y: 35, intensity: 1.0, radius: 15 },
      { x: 34, y: 38, intensity: 0.75, radius: 12 }, { x: 66, y: 38, intensity: 0.75, radius: 12 },
      { x: 50, y: 48, intensity: 0.5, radius: 11 }, { x: 50, y: 24, intensity: 0.45, radius: 10 },
    ],
    attack: [
      { x: 50, y: 22, intensity: 0.92, radius: 14 },
      { x: 36, y: 26, intensity: 0.65, radius: 11 }, { x: 64, y: 26, intensity: 0.65, radius: 11 },
      { x: 50, y: 14, intensity: 0.5, radius: 10 },
    ],
    defense: [
      { x: 50, y: 42, intensity: 0.7, radius: 12 },
      { x: 35, y: 44, intensity: 0.5, radius: 10 }, { x: 65, y: 44, intensity: 0.5, radius: 10 },
    ],
  },
  LW: {
    activity: [
      { x: 17, y: 27, intensity: 0.9, radius: 14 }, { x: 14, y: 40, intensity: 0.75, radius: 12 },
      { x: 28, y: 20, intensity: 0.65, radius: 11 }, { x: 35, y: 32, intensity: 0.5, radius: 10 },
    ],
    attack: [
      { x: 21, y: 16, intensity: 0.9, radius: 13 }, { x: 36, y: 20, intensity: 0.7, radius: 11 },
      { x: 14, y: 28, intensity: 0.5, radius: 9 }, { x: 44, y: 14, intensity: 0.55, radius: 10 },
    ],
    defense: [
      { x: 17, y: 38, intensity: 0.7, radius: 12 }, { x: 14, y: 52, intensity: 0.5, radius: 10 },
      { x: 28, y: 44, intensity: 0.45, radius: 9 },
    ],
  },
  RW: {
    activity: [
      { x: 83, y: 27, intensity: 0.9, radius: 14 }, { x: 86, y: 40, intensity: 0.75, radius: 12 },
      { x: 72, y: 20, intensity: 0.65, radius: 11 }, { x: 65, y: 32, intensity: 0.5, radius: 10 },
    ],
    attack: [
      { x: 79, y: 16, intensity: 0.9, radius: 13 }, { x: 64, y: 20, intensity: 0.7, radius: 11 },
      { x: 86, y: 28, intensity: 0.5, radius: 9 }, { x: 56, y: 14, intensity: 0.55, radius: 10 },
    ],
    defense: [
      { x: 83, y: 38, intensity: 0.7, radius: 12 }, { x: 86, y: 52, intensity: 0.5, radius: 10 },
      { x: 72, y: 44, intensity: 0.45, radius: 9 },
    ],
  },
  ST: {
    activity: [
      { x: 50, y: 14, intensity: 1.0, radius: 15 },
      { x: 37, y: 19, intensity: 0.75, radius: 12 }, { x: 63, y: 19, intensity: 0.75, radius: 12 },
      { x: 50, y: 27, intensity: 0.5, radius: 10 },
    ],
    attack: [
      { x: 50, y: 9, intensity: 1.0, radius: 15 },
      { x: 35, y: 13, intensity: 0.8, radius: 12 }, { x: 65, y: 13, intensity: 0.8, radius: 12 },
      { x: 50, y: 4, intensity: 0.65, radius: 11 },
      { x: 38, y: 21, intensity: 0.4, radius: 8 }, { x: 62, y: 21, intensity: 0.4, radius: 8 },
    ],
    defense: [
      { x: 50, y: 30, intensity: 0.65, radius: 12 },
      { x: 36, y: 35, intensity: 0.45, radius: 10 }, { x: 64, y: 35, intensity: 0.45, radius: 10 },
    ],
  },
  CF: {
    activity: [
      { x: 50, y: 17, intensity: 0.95, radius: 14 },
      { x: 36, y: 22, intensity: 0.7, radius: 12 }, { x: 64, y: 22, intensity: 0.7, radius: 12 },
      { x: 50, y: 30, intensity: 0.55, radius: 11 },
      { x: 38, y: 38, intensity: 0.35, radius: 9 }, { x: 62, y: 38, intensity: 0.35, radius: 9 },
    ],
    attack: [
      { x: 50, y: 11, intensity: 1.0, radius: 14 },
      { x: 35, y: 15, intensity: 0.78, radius: 12 }, { x: 65, y: 15, intensity: 0.78, radius: 12 },
      { x: 50, y: 5, intensity: 0.6, radius: 10 },
    ],
    defense: [
      { x: 50, y: 33, intensity: 0.65, radius: 12 },
      { x: 36, y: 38, intensity: 0.5, radius: 10 }, { x: 64, y: 38, intensity: 0.5, radius: 10 },
    ],
  },
};

// ─── 선수별 개인 히트맵 오버라이드 ────────────────────────────────────────────
const playerHotspots: Record<string, HotspotSet> = {
  'Bruno Fernandes': {
    activity: [
      { x: 50, y: 30, intensity: 1.0, radius: 16 }, { x: 36, y: 35, intensity: 0.78, radius: 13 },
      { x: 64, y: 35, intensity: 0.72, radius: 12 }, { x: 50, y: 18, intensity: 0.62, radius: 11 },
      { x: 50, y: 46, intensity: 0.42, radius: 9 },
    ],
    attack: [
      { x: 50, y: 16, intensity: 0.95, radius: 14 }, { x: 36, y: 21, intensity: 0.72, radius: 12 },
      { x: 64, y: 21, intensity: 0.72, radius: 12 }, { x: 50, y: 8, intensity: 0.55, radius: 10 },
    ],
    defense: [
      { x: 50, y: 44, intensity: 0.75, radius: 13 }, { x: 36, y: 48, intensity: 0.55, radius: 11 },
      { x: 64, y: 48, intensity: 0.55, radius: 11 },
    ],
  },
  'Alejandro Garnacho': {
    activity: [
      { x: 15, y: 24, intensity: 0.95, radius: 14 }, { x: 28, y: 18, intensity: 0.82, radius: 13 },
      { x: 12, y: 38, intensity: 0.68, radius: 11 }, { x: 40, y: 22, intensity: 0.55, radius: 10 },
      { x: 50, y: 16, intensity: 0.4, radius: 9 },
    ],
    attack: [
      { x: 20, y: 13, intensity: 0.95, radius: 13 }, { x: 35, y: 16, intensity: 0.78, radius: 11 },
      { x: 10, y: 22, intensity: 0.6, radius: 9 }, { x: 48, y: 12, intensity: 0.5, radius: 10 },
    ],
    defense: [
      { x: 14, y: 40, intensity: 0.7, radius: 12 }, { x: 12, y: 54, intensity: 0.48, radius: 9 },
    ],
  },
  'Marcus Rashford': {
    activity: [
      { x: 13, y: 30, intensity: 0.9, radius: 14 }, { x: 12, y: 44, intensity: 0.72, radius: 12 },
      { x: 25, y: 22, intensity: 0.65, radius: 11 }, { x: 38, y: 28, intensity: 0.45, radius: 9 },
    ],
    attack: [
      { x: 13, y: 18, intensity: 0.88, radius: 13 }, { x: 24, y: 14, intensity: 0.7, radius: 11 },
      { x: 12, y: 30, intensity: 0.52, radius: 9 },
    ],
    defense: [
      { x: 14, y: 46, intensity: 0.65, radius: 11 }, { x: 12, y: 58, intensity: 0.45, radius: 9 },
    ],
  },
  'Rasmus Hojlund': {
    activity: [
      { x: 50, y: 12, intensity: 1.0, radius: 15 }, { x: 38, y: 17, intensity: 0.78, radius: 12 },
      { x: 62, y: 17, intensity: 0.78, radius: 12 }, { x: 50, y: 24, intensity: 0.52, radius: 10 },
      { x: 32, y: 23, intensity: 0.38, radius: 8 }, { x: 68, y: 23, intensity: 0.38, radius: 8 },
    ],
    attack: [
      { x: 50, y: 7, intensity: 1.0, radius: 14 }, { x: 36, y: 11, intensity: 0.82, radius: 12 },
      { x: 64, y: 11, intensity: 0.82, radius: 12 }, { x: 50, y: 3, intensity: 0.65, radius: 10 },
    ],
    defense: [
      { x: 50, y: 28, intensity: 0.6, radius: 11 }, { x: 38, y: 33, intensity: 0.4, radius: 9 },
    ],
  },
  'Kobbie Mainoo': {
    activity: [
      { x: 50, y: 46, intensity: 0.95, radius: 14 }, { x: 36, y: 48, intensity: 0.72, radius: 12 },
      { x: 64, y: 48, intensity: 0.68, radius: 11 }, { x: 50, y: 34, intensity: 0.55, radius: 10 },
      { x: 50, y: 59, intensity: 0.38, radius: 9 },
    ],
    attack: [
      { x: 50, y: 33, intensity: 0.78, radius: 13 }, { x: 36, y: 38, intensity: 0.58, radius: 11 },
      { x: 64, y: 38, intensity: 0.55, radius: 10 }, { x: 50, y: 23, intensity: 0.4, radius: 9 },
    ],
    defense: [
      { x: 50, y: 54, intensity: 0.88, radius: 13 }, { x: 36, y: 57, intensity: 0.65, radius: 11 },
      { x: 64, y: 57, intensity: 0.62, radius: 10 },
    ],
  },
  'Manuel Ugarte': {
    activity: [
      { x: 50, y: 60, intensity: 0.95, radius: 15 }, { x: 34, y: 62, intensity: 0.75, radius: 12 },
      { x: 66, y: 62, intensity: 0.75, radius: 12 }, { x: 50, y: 72, intensity: 0.55, radius: 10 },
      { x: 50, y: 49, intensity: 0.38, radius: 9 },
    ],
    attack: [
      { x: 50, y: 52, intensity: 0.55, radius: 11 }, { x: 36, y: 56, intensity: 0.42, radius: 9 },
    ],
    defense: [
      { x: 50, y: 65, intensity: 1.0, radius: 15 }, { x: 34, y: 67, intensity: 0.82, radius: 13 },
      { x: 66, y: 67, intensity: 0.82, radius: 13 }, { x: 50, y: 75, intensity: 0.65, radius: 11 },
      { x: 50, y: 55, intensity: 0.45, radius: 9 },
    ],
  },
  'Diogo Dalot': {
    activity: [
      { x: 87, y: 62, intensity: 0.9, radius: 13 }, { x: 86, y: 46, intensity: 0.82, radius: 12 },
      { x: 88, y: 76, intensity: 0.65, radius: 10 }, { x: 80, y: 33, intensity: 0.5, radius: 9 },
      { x: 75, y: 20, intensity: 0.42, radius: 8 },
    ],
    attack: [
      { x: 87, y: 27, intensity: 0.8, radius: 13 }, { x: 83, y: 16, intensity: 0.62, radius: 10 },
      { x: 77, y: 38, intensity: 0.45, radius: 9 },
    ],
    defense: [
      { x: 88, y: 78, intensity: 1.0, radius: 14 }, { x: 89, y: 66, intensity: 0.85, radius: 12 },
      { x: 83, y: 72, intensity: 0.65, radius: 10 },
    ],
  },
  'Lisandro Martinez': {
    activity: [
      { x: 28, y: 74, intensity: 0.95, radius: 14 }, { x: 16, y: 77, intensity: 0.72, radius: 11 },
      { x: 40, y: 70, intensity: 0.65, radius: 10 }, { x: 26, y: 62, intensity: 0.42, radius: 8 },
      { x: 20, y: 58, intensity: 0.35, radius: 7 },
    ],
    attack: [
      { x: 28, y: 58, intensity: 0.58, radius: 11 }, { x: 20, y: 64, intensity: 0.42, radius: 9 },
      { x: 36, y: 52, intensity: 0.35, radius: 8 },
    ],
    defense: [
      { x: 28, y: 78, intensity: 1.0, radius: 14 }, { x: 16, y: 82, intensity: 0.82, radius: 12 },
      { x: 40, y: 76, intensity: 0.72, radius: 11 }, { x: 26, y: 87, intensity: 0.52, radius: 9 },
    ],
  },
  'Harry Maguire': {
    activity: [
      { x: 52, y: 74, intensity: 0.9, radius: 14 }, { x: 38, y: 72, intensity: 0.72, radius: 12 },
      { x: 66, y: 72, intensity: 0.68, radius: 11 }, { x: 52, y: 62, intensity: 0.42, radius: 9 },
    ],
    attack: [
      { x: 52, y: 58, intensity: 0.55, radius: 11 }, { x: 38, y: 64, intensity: 0.38, radius: 9 },
      { x: 52, y: 48, intensity: 0.28, radius: 7 },
    ],
    defense: [
      { x: 52, y: 78, intensity: 1.0, radius: 14 }, { x: 38, y: 76, intensity: 0.82, radius: 12 },
      { x: 66, y: 76, intensity: 0.78, radius: 12 }, { x: 52, y: 87, intensity: 0.58, radius: 10 },
    ],
  },
  'Andre Onana': {
    activity: [
      { x: 50, y: 93, intensity: 1.0, radius: 13 }, { x: 32, y: 87, intensity: 0.62, radius: 9 },
      { x: 68, y: 87, intensity: 0.62, radius: 9 }, { x: 50, y: 82, intensity: 0.38, radius: 8 },
      { x: 50, y: 73, intensity: 0.25, radius: 7 },
    ],
    attack: [
      { x: 50, y: 88, intensity: 0.75, radius: 10 }, { x: 35, y: 84, intensity: 0.52, radius: 8 },
      { x: 65, y: 84, intensity: 0.52, radius: 8 },
    ],
    defense: [
      { x: 50, y: 95, intensity: 1.0, radius: 13 }, { x: 33, y: 90, intensity: 0.78, radius: 11 },
      { x: 67, y: 90, intensity: 0.78, radius: 11 }, { x: 50, y: 85, intensity: 0.55, radius: 9 },
    ],
  },
  'Noussair Mazraoui': {
    activity: [
      { x: 85, y: 55, intensity: 0.9, radius: 13 }, { x: 86, y: 40, intensity: 0.78, radius: 12 },
      { x: 84, y: 70, intensity: 0.62, radius: 10 }, { x: 79, y: 28, intensity: 0.48, radius: 9 },
    ],
    attack: [
      { x: 85, y: 24, intensity: 0.82, radius: 13 }, { x: 81, y: 14, intensity: 0.6, radius: 10 },
      { x: 76, y: 36, intensity: 0.42, radius: 9 },
    ],
    defense: [
      { x: 86, y: 74, intensity: 1.0, radius: 14 }, { x: 88, y: 62, intensity: 0.82, radius: 12 },
      { x: 82, y: 68, intensity: 0.65, radius: 10 },
    ],
  },
  'Patrick Dorgu': {
    activity: [
      { x: 13, y: 40, intensity: 0.92, radius: 14 }, { x: 13, y: 58, intensity: 0.72, radius: 12 },
      { x: 16, y: 25, intensity: 0.65, radius: 11 }, { x: 19, y: 75, intensity: 0.45, radius: 9 },
      { x: 20, y: 14, intensity: 0.38, radius: 8 },
    ],
    attack: [
      { x: 13, y: 22, intensity: 0.82, radius: 13 }, { x: 16, y: 12, intensity: 0.62, radius: 10 },
      { x: 22, y: 34, intensity: 0.48, radius: 9 },
    ],
    defense: [
      { x: 13, y: 70, intensity: 1.0, radius: 14 }, { x: 11, y: 60, intensity: 0.8, radius: 12 },
      { x: 19, y: 78, intensity: 0.65, radius: 10 },
    ],
  },
  'Mathys Tel': {
    activity: [
      { x: 82, y: 24, intensity: 0.9, radius: 14 }, { x: 85, y: 38, intensity: 0.72, radius: 12 },
      { x: 70, y: 18, intensity: 0.62, radius: 11 }, { x: 60, y: 28, intensity: 0.5, radius: 10 },
      { x: 50, y: 18, intensity: 0.38, radius: 9 },
    ],
    attack: [
      { x: 78, y: 14, intensity: 0.92, radius: 13 }, { x: 62, y: 16, intensity: 0.72, radius: 11 },
      { x: 86, y: 26, intensity: 0.52, radius: 9 }, { x: 52, y: 12, intensity: 0.48, radius: 9 },
    ],
    defense: [
      { x: 82, y: 36, intensity: 0.68, radius: 12 }, { x: 85, y: 50, intensity: 0.48, radius: 9 },
    ],
  },
};

// ─── 선수별 레이더 스탯 데이터 [패싱, 슈팅, 수비, 체력, 스피드, 전술] ────────
const playerRadarData: Record<string, number[]> = {
  'Bruno Fernandes':    [92, 83, 62, 79, 70, 96],
  'Alejandro Garnacho': [70, 78, 52, 87, 94, 72],
  'Marcus Rashford':    [68, 76, 50, 88, 96, 70],
  'Rasmus Hojlund':     [62, 86, 44, 88, 91, 68],
  'Kobbie Mainoo':      [86, 66, 78, 86, 76, 90],
  'Manuel Ugarte':      [78, 50, 93, 91, 76, 88],
  'Diogo Dalot':        [77, 68, 84, 88, 84, 82],
  'Lisandro Martinez':  [72, 44, 95, 84, 76, 88],
  'Harry Maguire':      [70, 52, 88, 82, 65, 84],
  'Andre Onana':        [82, 30, 88, 80, 64, 80],
  'Noussair Mazraoui':  [75, 62, 84, 86, 80, 80],
  'Patrick Dorgu':      [74, 66, 80, 88, 86, 78],
  'Mathys Tel':         [72, 82, 56, 84, 91, 74],
  'Leny Yoro':          [68, 44, 90, 84, 82, 84],
  'Joshua Zirkzee':     [80, 74, 46, 78, 76, 85],
  'Luke Shaw':          [74, 56, 82, 82, 76, 80],
  'Victor Lindelof':    [72, 48, 82, 80, 72, 80],
  'Casemiro':           [80, 54, 88, 82, 70, 88],
  'Amad Diallo':        [70, 74, 54, 84, 88, 72],
  'Harry Amass':        [68, 52, 78, 82, 78, 74],
};
const RADAR_LABELS = ['패싱', '슈팅', '수비', '체력', '스피드', '전술'];
const RADAR_AVG = [72, 68, 72, 78, 74, 74]; // 팀 평균 기준

// ─── API-Football Player ID → 정식 이름 매핑 ────────────────────────────────
// DB에 약어(K. Mainoo)로 저장돼도 히트맵/레이더/스탯 조회를 정식 이름으로 처리
const playerIdToFullName: Record<number, string> = {
  1485: 'Bruno Fernandes',
  886: 'Diogo Dalot',
  2467: 'Lisandro Martinez',
  2935: 'Harry Maguire',
  284322: 'Kobbie Mainoo',
  51494: 'Manuel Ugarte',
  747: 'Casemiro',
  891: 'Luke Shaw',
  342970: 'Leny Yoro',
  50132: 'Altay Bayindir',
  2931: 'Tom Heaton',
  157997: 'Amad Diallo',
  70100: 'Joshua Zirkzee',
  37145: 'Tyrell Malacia',
  382452: 'Patrick Dorgu',
  19960: 'Andre Onana',
  359260: 'Alejandro Garnacho',
  346837: 'Rasmus Hojlund',
  47765: 'Noussair Mazraoui',
  19220: 'Mason Mount',
  405553: 'Mathys Tel',
};

// 약어 이름 → 정식 이름 폴백 맵 (DB 저장 값이 약어일 때)
const abbreviatedToFullName: Record<string, string> = {
  'K. Mainoo': 'Kobbie Mainoo',
  'M. Ugarte': 'Manuel Ugarte',
  'L. Martinez': 'Lisandro Martinez',
  'H. Maguire': 'Harry Maguire',
  'D. Dalot': 'Diogo Dalot',
  'L. Shaw': 'Luke Shaw',
  'L. Yoro': 'Leny Yoro',
  'A. Bayindir': 'Altay Bayindir',
  'A. Bay\u0131nd\u0131r': 'Altay Bayindir',
  'T. Heaton': 'Tom Heaton',
  'A. Diallo': 'Amad Diallo',
  'J. Zirkzee': 'Joshua Zirkzee',
  'T. Malacia': 'Tyrell Malacia',
  'P. Dorgu': 'Patrick Dorgu',
  'A. Onana': 'Andre Onana',
  'A. Garnacho': 'Alejandro Garnacho',
  'R. Hojlund': 'Rasmus Hojlund',
  'R. H\u00f8jlund': 'Rasmus Hojlund',
  'N. Mazraoui': 'Noussair Mazraoui',
  'M. Mount': 'Mason Mount',
  'M. Tel': 'Mathys Tel',
  'M. Rashford': 'Marcus Rashford',
  'B. Fernandes': 'Bruno Fernandes',
};

// ─── 선수별 더미 스탯 (API 0 반환 시 폴백) ───────────────────────────────────
const playerDummyStats: Record<string, any> = {
  'Bruno Fernandes': {
    games: { appearances: 35, minutes: 2968, rating: '7.82' },
    goals: { total: 14, assists: 10, saves: null, conceded: null },
    shots: { total: 98, on: 52 },
    passes: { total: 1820, key: 88, accuracy: 84 },
    tackles: { total: 28, blocks: 12, interceptions: 18 },
    duels: { total: 285, won: 152 },
    dribbles: { attempts: 65, success: 38 },
    fouls: { drawn: 42, committed: 24 },
    cards: { yellow: 6, yellowred: 0, red: 0 },
    penalty: { scored: 4, missed: 1 },
  },
  'Kobbie Mainoo': {
    games: { appearances: 30, minutes: 2456, rating: '7.54' },
    goals: { total: 3, assists: 5, saves: null, conceded: null },
    shots: { total: 42, on: 18 },
    passes: { total: 1640, key: 46, accuracy: 88 },
    tackles: { total: 62, blocks: 18, interceptions: 35 },
    duels: { total: 310, won: 178 },
    dribbles: { attempts: 55, success: 34 },
    fouls: { drawn: 28, committed: 32 },
    cards: { yellow: 5, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Manuel Ugarte': {
    games: { appearances: 28, minutes: 2180, rating: '7.38' },
    goals: { total: 0, assists: 2, saves: null, conceded: null },
    shots: { total: 14, on: 5 },
    passes: { total: 1520, key: 22, accuracy: 86 },
    tackles: { total: 85, blocks: 22, interceptions: 52 },
    duels: { total: 380, won: 220 },
    dribbles: { attempts: 35, success: 20 },
    fouls: { drawn: 18, committed: 48 },
    cards: { yellow: 8, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Diogo Dalot': {
    games: { appearances: 32, minutes: 2640, rating: '7.22' },
    goals: { total: 3, assists: 6, saves: null, conceded: null },
    shots: { total: 35, on: 15 },
    passes: { total: 1680, key: 52, accuracy: 80 },
    tackles: { total: 55, blocks: 20, interceptions: 38 },
    duels: { total: 290, won: 155 },
    dribbles: { attempts: 72, success: 44 },
    fouls: { drawn: 35, committed: 28 },
    cards: { yellow: 4, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Lisandro Martinez': {
    games: { appearances: 24, minutes: 1980, rating: '7.44' },
    goals: { total: 0, assists: 1, saves: null, conceded: null },
    shots: { total: 12, on: 4 },
    passes: { total: 1420, key: 18, accuracy: 88 },
    tackles: { total: 58, blocks: 28, interceptions: 42 },
    duels: { total: 265, won: 158 },
    dribbles: { attempts: 22, success: 14 },
    fouls: { drawn: 14, committed: 30 },
    cards: { yellow: 5, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Harry Maguire': {
    games: { appearances: 22, minutes: 1742, rating: '7.02' },
    goals: { total: 2, assists: 0, saves: null, conceded: null },
    shots: { total: 18, on: 8 },
    passes: { total: 1180, key: 12, accuracy: 86 },
    tackles: { total: 42, blocks: 32, interceptions: 28 },
    duels: { total: 210, won: 118 },
    dribbles: { attempts: 12, success: 6 },
    fouls: { drawn: 8, committed: 22 },
    cards: { yellow: 4, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Alejandro Garnacho': {
    games: { appearances: 33, minutes: 2520, rating: '7.64' },
    goals: { total: 13, assists: 7, saves: null, conceded: null },
    shots: { total: 88, on: 42 },
    passes: { total: 880, key: 56, accuracy: 72 },
    tackles: { total: 18, blocks: 8, interceptions: 12 },
    duels: { total: 240, won: 128 },
    dribbles: { attempts: 120, success: 68 },
    fouls: { drawn: 58, committed: 18 },
    cards: { yellow: 3, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Rasmus Hojlund': {
    games: { appearances: 28, minutes: 2150, rating: '7.28' },
    goals: { total: 16, assists: 4, saves: null, conceded: null },
    shots: { total: 95, on: 48 },
    passes: { total: 520, key: 28, accuracy: 68 },
    tackles: { total: 12, blocks: 4, interceptions: 8 },
    duels: { total: 195, won: 95 },
    dribbles: { attempts: 55, success: 28 },
    fouls: { drawn: 45, committed: 22 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 2, missed: 0 },
  },
  'Andre Onana': {
    games: { appearances: 34, minutes: 3060, rating: '7.15' },
    goals: { total: 0, assists: 0, saves: 95, conceded: 48 },
    shots: { total: 0, on: 0 },
    passes: { total: 820, key: 4, accuracy: 72 },
    tackles: { total: 4, blocks: 2, interceptions: 2 },
    duels: { total: 22, won: 12 },
    dribbles: { attempts: 4, success: 2 },
    fouls: { drawn: 2, committed: 4 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Casemiro': {
    games: { appearances: 20, minutes: 1540, rating: '6.82' },
    goals: { total: 1, assists: 1, saves: null, conceded: null },
    shots: { total: 18, on: 6 },
    passes: { total: 1220, key: 24, accuracy: 84 },
    tackles: { total: 55, blocks: 15, interceptions: 38 },
    duels: { total: 255, won: 148 },
    dribbles: { attempts: 28, success: 14 },
    fouls: { drawn: 18, committed: 45 },
    cards: { yellow: 7, yellowred: 1, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Luke Shaw': {
    games: { appearances: 14, minutes: 980, rating: '7.18' },
    goals: { total: 0, assists: 3, saves: null, conceded: null },
    shots: { total: 8, on: 3 },
    passes: { total: 820, key: 28, accuracy: 82 },
    tackles: { total: 28, blocks: 10, interceptions: 20 },
    duels: { total: 142, won: 82 },
    dribbles: { attempts: 30, success: 18 },
    fouls: { drawn: 16, committed: 12 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Patrick Dorgu': {
    games: { appearances: 26, minutes: 1980, rating: '7.12' },
    goals: { total: 2, assists: 5, saves: null, conceded: null },
    shots: { total: 28, on: 12 },
    passes: { total: 1140, key: 42, accuracy: 76 },
    tackles: { total: 48, blocks: 16, interceptions: 32 },
    duels: { total: 248, won: 132 },
    dribbles: { attempts: 68, success: 38 },
    fouls: { drawn: 32, committed: 24 },
    cards: { yellow: 4, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Leny Yoro': {
    games: { appearances: 18, minutes: 1380, rating: '7.35' },
    goals: { total: 0, assists: 0, saves: null, conceded: null },
    shots: { total: 8, on: 2 },
    passes: { total: 1020, key: 10, accuracy: 88 },
    tackles: { total: 45, blocks: 22, interceptions: 32 },
    duels: { total: 185, won: 108 },
    dribbles: { attempts: 15, success: 9 },
    fouls: { drawn: 8, committed: 18 },
    cards: { yellow: 3, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Noussair Mazraoui': {
    games: { appearances: 25, minutes: 1920, rating: '7.20' },
    goals: { total: 1, assists: 4, saves: null, conceded: null },
    shots: { total: 18, on: 7 },
    passes: { total: 1280, key: 38, accuracy: 80 },
    tackles: { total: 50, blocks: 18, interceptions: 32 },
    duels: { total: 235, won: 130 },
    dribbles: { attempts: 55, success: 32 },
    fouls: { drawn: 28, committed: 22 },
    cards: { yellow: 3, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Amad Diallo': {
    games: { appearances: 22, minutes: 1520, rating: '7.32' },
    goals: { total: 6, assists: 4, saves: null, conceded: null },
    shots: { total: 52, on: 24 },
    passes: { total: 720, key: 38, accuracy: 74 },
    tackles: { total: 14, blocks: 6, interceptions: 10 },
    duels: { total: 185, won: 96 },
    dribbles: { attempts: 85, success: 48 },
    fouls: { drawn: 42, committed: 14 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Joshua Zirkzee': {
    games: { appearances: 24, minutes: 1680, rating: '7.08' },
    goals: { total: 7, assists: 4, saves: null, conceded: null },
    shots: { total: 65, on: 28 },
    passes: { total: 680, key: 42, accuracy: 76 },
    tackles: { total: 10, blocks: 4, interceptions: 6 },
    duels: { total: 165, won: 78 },
    dribbles: { attempts: 48, success: 28 },
    fouls: { drawn: 38, committed: 16 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Altay Bayindir': {
    games: { appearances: 8, minutes: 720, rating: '7.08' },
    goals: { total: 0, assists: 0, saves: 28, conceded: 14 },
    shots: { total: 0, on: 0 },
    passes: { total: 280, key: 2, accuracy: 70 },
    tackles: { total: 2, blocks: 0, interceptions: 0 },
    duels: { total: 8, won: 4 },
    dribbles: { attempts: 2, success: 1 },
    fouls: { drawn: 0, committed: 2 },
    cards: { yellow: 1, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Tyrell Malacia': {
    games: { appearances: 16, minutes: 1080, rating: '6.98' },
    goals: { total: 0, assists: 2, saves: null, conceded: null },
    shots: { total: 6, on: 2 },
    passes: { total: 720, key: 22, accuracy: 78 },
    tackles: { total: 38, blocks: 12, interceptions: 24 },
    duels: { total: 168, won: 92 },
    dribbles: { attempts: 35, success: 20 },
    fouls: { drawn: 22, committed: 18 },
    cards: { yellow: 3, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Mason Mount': {
    games: { appearances: 12, minutes: 680, rating: '6.72' },
    goals: { total: 1, assists: 2, saves: null, conceded: null },
    shots: { total: 22, on: 8 },
    passes: { total: 620, key: 28, accuracy: 80 },
    tackles: { total: 18, blocks: 6, interceptions: 12 },
    duels: { total: 115, won: 58 },
    dribbles: { attempts: 32, success: 18 },
    fouls: { drawn: 18, committed: 14 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Mathys Tel': {
    games: { appearances: 18, minutes: 1240, rating: '7.18' },
    goals: { total: 8, assists: 4, saves: null, conceded: null },
    shots: { total: 58, on: 28 },
    passes: { total: 640, key: 42, accuracy: 74 },
    tackles: { total: 16, blocks: 5, interceptions: 10 },
    duels: { total: 185, won: 96 },
    dribbles: { attempts: 88, success: 52 },
    fouls: { drawn: 38, committed: 15 },
    cards: { yellow: 2, yellowred: 0, red: 0 },
    penalty: { scored: 0, missed: 0 },
  },
  'Marcus Rashford': {
    games: { appearances: 28, minutes: 2080, rating: '7.20' },
    goals: { total: 10, assists: 5, saves: null, conceded: null },
    shots: { total: 75, on: 35 },
    passes: { total: 760, key: 48, accuracy: 72 },
    tackles: { total: 15, blocks: 6, interceptions: 10 },
    duels: { total: 210, won: 112 },
    dribbles: { attempts: 98, success: 56 },
    fouls: { drawn: 52, committed: 18 },
    cards: { yellow: 3, yellowred: 0, red: 0 },
    penalty: { scored: 1, missed: 0 },
  },
};

// ─── 레이더 차트 컴포넌트 ─────────────────────────────────────────────────────
const RadarChart: React.FC<{ playerName: string }> = ({ playerName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = playerRadarData[playerName] ?? RADAR_AVG;
  const N = RADAR_LABELS.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2 - 10;
    const maxR = Math.min(W, H) * 0.36;

    ctx.clearRect(0, 0, W, H);

    const angle = (i: number) => (Math.PI / 2) * 3 + (2 * Math.PI * i) / N;
    const pt = (i: number, r: number) => ({
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    });

    // 배경 그리드 (5단계)
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const p = pt(i, r);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = ring === 5 ? 1.2 : 0.7;
      ctx.stroke();
    }

    // 축 선
    for (let i = 0; i < N; i++) {
      const p = pt(i, maxR);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 팀 평균 폴리곤 (흰색 점선)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const r = (RADAR_AVG[i] / 100) * maxR;
      const p = pt(i, r);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(200,200,200,0.55)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,200,200,0.07)';
    ctx.fill();
    ctx.setLineDash([]);

    // 선수 폴리곤 (빨간색)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const r = (data[i] / 100) * maxR;
      const p = pt(i, r);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(229,62,62,0.22)';
    ctx.fill();

    // 데이터 포인트 점
    for (let i = 0; i < N; i++) {
      const r = (data[i] / 100) * maxR;
      const p = pt(i, r);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fc8181';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 축 라벨 + 수치
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const lp = pt(i, maxR + 22);
      const vp = pt(i, maxR + 11);
      // 수치
      ctx.fillStyle = '#fc8181';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(String(data[i]), vp.x, vp.y);
      // 라벨
      ctx.fillStyle = 'rgba(200,200,200,0.85)';
      ctx.font = '10px sans-serif';
      ctx.fillText(RADAR_LABELS[i], lp.x, lp.y);
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={220}
      className="w-full"
      style={{ maxWidth: '280px', display: 'block', margin: '0 auto' }}
    />
  );
};

// ─── 열화상 색상 매핑 ─────────────────────────────────────────────────────────
function heatColor(t: number): [number, number, number, number] {
  if (t < 0.01) return [0, 0, 0, 0];
  const stops: Array<[number, [number, number, number, number]]> = [
    [0.01, [0, 0, 200, 20]],
    [0.18, [0, 80, 255, 70]],
    [0.36, [0, 210, 200, 130]],
    [0.56, [80, 255, 30, 175]],
    [0.72, [255, 230, 0, 210]],
    [0.88, [255, 110, 0, 235]],
    [1.00, [255, 10, 0, 255]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const lo = stops[i - 1], hi = stops[i];
      const f = (t - lo[0]) / (hi[0] - lo[0]);
      return [
        Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * f),
        Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * f),
        Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * f),
        Math.round(lo[1][3] + (hi[1][3] - lo[1][3]) * f),
      ];
    }
  }
  return [255, 10, 0, 255];
}

// ─── 히트맵 컴포넌트 ──────────────────────────────────────────────────────────
const CW = 280, CH = 420, PAD = 16;

const Heatmap: React.FC<{ subPos: string; mode: HeatMode; playerName?: string }> = ({ subPos, mode, playerName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const iW = CW - 2 * PAD, iH = CH - 2 * PAD;

    // 1. 피치 배경 (줄무늬)
    const stripes = 12;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1a7038' : '#176432';
      ctx.fillRect(0, (i / stripes) * CH, CW, CH / stripes);
    }

    // 2. 히트맵 오프스크린 렌더링
    const off = document.createElement('canvas');
    off.width = CW; off.height = CH;
    const oc = off.getContext('2d')!;
    oc.fillStyle = '#000';
    oc.fillRect(0, 0, CW, CH);
    oc.globalCompositeOperation = 'lighter';

    const hotspotSet = (playerName && playerHotspots[playerName])
      ? playerHotspots[playerName]
      : (subPositionHotspots[subPos] ?? subPositionHotspots['CM']);
    const hotspots: Hotspot[] = hotspotSet[mode];

    for (const spot of hotspots) {
      const cx = PAD + (spot.x / 100) * iW;
      const cy = PAD + (spot.y / 100) * iH;
      const r  = (spot.radius / 100) * Math.min(CW, CH) * 1.6;

      const g = oc.createRadialGradient(cx, cy, 0, cx, cy, r);
      const a = spot.intensity;
      g.addColorStop(0,    `rgba(255,255,255,${Math.min(1, a * 1.0).toFixed(2)})`);
      g.addColorStop(0.3,  `rgba(255,255,255,${Math.min(1, a * 0.65).toFixed(2)})`);
      g.addColorStop(0.65, `rgba(255,255,255,${Math.min(1, a * 0.2).toFixed(2)})`);
      g.addColorStop(1,    'rgba(0,0,0,0)');
      oc.fillStyle = g;
      oc.beginPath();
      oc.arc(cx, cy, r, 0, Math.PI * 2);
      oc.fill();
    }

    // 3. 픽셀 열화상 변환
    const img = oc.getImageData(0, 0, CW, CH);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const brightness = d[i] / 255;
      const [r, g, b, a] = heatColor(Math.min(1, brightness));
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
    }
    oc.putImageData(img, 0, 0);

    ctx.globalAlpha = 0.88;
    ctx.drawImage(off, 0, 0);
    ctx.globalAlpha = 1;

    // 4. 피치 선 위에 그리기
    ctx.strokeStyle = 'rgba(255,255,255,0.80)';
    ctx.lineWidth = 1.5;

    // 외곽
    ctx.strokeRect(PAD, PAD, iW, iH);

    // 센터라인
    ctx.beginPath();
    ctx.moveTo(PAD, CH / 2); ctx.lineTo(CW - PAD, CH / 2); ctx.stroke();

    // 센터서클
    ctx.beginPath();
    ctx.arc(CW / 2, CH / 2, iW * 0.18, 0, Math.PI * 2); ctx.stroke();

    // 센터도트
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(CW / 2, CH / 2, 2.5, 0, Math.PI * 2); ctx.fill();

    // 페널티 박스 (상/하)
    const pbW = iW * 0.57, pbH = iH * 0.19;
    ctx.strokeRect(PAD + (iW - pbW) / 2, PAD, pbW, pbH);
    ctx.strokeRect(PAD + (iW - pbW) / 2, CH - PAD - pbH, pbW, pbH);

    // 골 에어리어 (상/하)
    const gaW = iW * 0.28, gaH = iH * 0.075;
    ctx.strokeRect(PAD + (iW - gaW) / 2, PAD, gaW, gaH);
    ctx.strokeRect(PAD + (iW - gaW) / 2, CH - PAD - gaH, gaW, gaH);

    // 페널티 스팟
    const tSpy = PAD + pbH * 0.62, bSpy = CH - PAD - pbH * 0.62;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(CW / 2, tSpy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(CW / 2, bSpy, 2.5, 0, Math.PI * 2); ctx.fill();

    // 페널티 아크
    ctx.strokeStyle = 'rgba(255,255,255,0.80)';
    ctx.beginPath();
    ctx.arc(CW / 2, tSpy, iW * 0.18, Math.PI * 0.16, Math.PI * 0.84); ctx.stroke();
    ctx.beginPath();
    ctx.arc(CW / 2, bSpy, iW * 0.18, -Math.PI * 0.84, -Math.PI * 0.16); ctx.stroke();

    // 코너 아크
    for (const [cx2, cy2, sa, ea] of [
      [PAD, PAD, 0, Math.PI / 2],
      [CW - PAD, PAD, Math.PI / 2, Math.PI],
      [PAD, CH - PAD, -Math.PI / 2, 0],
      [CW - PAD, CH - PAD, Math.PI, 3 * Math.PI / 2],
    ] as [number, number, number, number][]) {
      ctx.beginPath(); ctx.arc(cx2, cy2, 7, sa, ea); ctx.stroke();
    }

    // 존 라벨
    ctx.font = '9px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.textAlign = 'left';
    ctx.fillText('\u25b2 \uacf5\uaca9 \uc9c4\uc601', PAD + 4, PAD + 10);
    ctx.fillText('\u25bc \uc218\ube44 \uc9c4\uc601', PAD + 4, CH - PAD - 4);
  }, [subPos, mode]);

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      className="rounded-xl w-full"
      style={{ maxWidth: `${CW}px`, display: 'block', margin: '0 auto' }}
    />
  );
};

// ─── 스탯 컴포넌트 ────────────────────────────────────────────────────────────
const StatBar: React.FC<{ label: string; value: number | null | undefined; max: number; unit?: string }> = ({
  label, value, max, unit = '',
}) => {
  if (value === null || value === undefined) return null;
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-[#3a3939] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ value: string | number; label: string; sub?: string }> = ({ value, label, sub }) => (
  <div className="bg-[#2e2d2d] rounded-xl p-4 text-center flex-1 min-w-[70px]">
    <div className="text-2xl font-bold text-white mb-1">{value ?? '-'}</div>
    <div className="text-xs text-gray-400">{label}</div>
    {sub && <div className="text-xs text-red-400 mt-0.5">{sub}</div>}
  </div>
);

interface Stats { [key: string]: any }
const StatTabs: React.FC<{ stats: Stats; position: string; source?: string; fplExtra?: any }> = ({
  stats, position, source, fplExtra,
}) => {
  const [tab, setTab] = useState('attack');
  const isGK = position === 'Goalkeeper';
  const hasFPL = source === 'fpl';

  const tabs = isGK
    ? [{ key: 'gk', label: '골키퍼' }, hasFPL && { key: 'fpl', label: '영향력' }, { key: 'discipline', label: '경고/퇴장' }].filter(Boolean) as { key: string; label: string }[]
    : hasFPL
    ? [{ key: 'attack', label: '공격' }, { key: 'defense', label: '수비' }, { key: 'fpl', label: '영향력' }, { key: 'discipline', label: '경고/퇴장' }]
    : [{ key: 'attack', label: '공격' }, { key: 'pass', label: '패스' }, { key: 'defense', label: '수비' }, { key: 'dribble', label: '드리블' }, { key: 'discipline', label: '경고/퇴장' }];

  const goals = stats?.goals ?? {};
  const shots = stats?.shots ?? {};
  const passes = stats?.passes ?? {};
  const tackles = stats?.tackles ?? {};
  const duels = stats?.duels ?? {};
  const dribbles = stats?.dribbles ?? {};
  const fouls = stats?.fouls ?? {};
  const cards = stats?.cards ?? {};
  const penalty = stats?.penalty ?? {};
  const pctDuel = duels.total ? Math.round(((duels.won ?? 0) / duels.total) * 100) : null;
  const pctDrib = dribbles.attempts ? Math.round(((dribbles.success ?? 0) / dribbles.attempts) * 100) : null;
  const shotAcc = shots.total ? Math.round(((shots.on ?? 0) / shots.total) * 100) : null;

  const renderTab = () => {
    switch (tab) {
      case 'attack': return (
        <div>
          <StatBar label="골" value={goals.total} max={30} />
          <StatBar label="어시스트" value={goals.assists} max={20} />
          {stats.xg != null && <StatBar label="xG (기대골)" value={stats.xg} max={30} />}
          {stats.xa != null && <StatBar label="xA (기대어시스트)" value={stats.xa} max={20} />}
          {stats.xgi != null && <StatBar label="xGI (기대공헌도)" value={stats.xgi} max={40} />}
          <StatBar label="유효슈팅" value={shots.on} max={50} />
          <StatBar label="슈팅 정확도" value={shotAcc} max={100} unit="%" />
          <StatBar label="페널티 득점" value={penalty.scored} max={10} />
        </div>
      );
      case 'pass': return (
        <div>
          <StatBar label="전체 패스" value={passes.total} max={2000} />
          <StatBar label="키 패스" value={passes.key} max={120} />
          <StatBar label="패스 정확도" value={passes.accuracy} max={100} unit="%" />
        </div>
      );
      case 'defense': return (
        <div>
          <StatBar label="태클" value={tackles.total} max={80} />
          <StatBar label="인터셉트" value={tackles.interceptions} max={50} />
          <StatBar label="블록" value={tackles.blocks} max={30} />
          <StatBar label="듀얼 승리" value={duels.won} max={200} />
          <StatBar label="듀얼 승률" value={pctDuel} max={100} unit="%" />
          {stats.cbi != null && <StatBar label="CBI" value={stats.cbi} max={150} />}
          {stats.recoveries != null && <StatBar label="볼 회수" value={stats.recoveries} max={200} />}
          {stats.cleanSheets != null && <StatBar label="클린시트" value={stats.cleanSheets} max={38} />}
        </div>
      );
      case 'dribble': return (
        <div>
          <StatBar label="드리블 시도" value={dribbles.attempts} max={100} />
          <StatBar label="드리블 성공" value={dribbles.success} max={60} />
          <StatBar label="드리블 성공률" value={pctDrib} max={100} unit="%" />
          <StatBar label="유도한 파울" value={fouls.drawn} max={60} />
        </div>
      );
      case 'gk': return (
        <div>
          <StatBar label="선방" value={goals.saves} max={120} />
          <StatBar label="실점" value={goals.conceded} max={60} />
        </div>
      );
      case 'discipline': return (
        <div>
          <StatBar label="파울 범함" value={fouls.committed} max={80} />
          <StatBar label="유도한 에러" value={fouls.drawn} max={60} />
          <StatBar label="옐로카드" value={cards.yellow} max={15} />
          <StatBar label="더블 옐로카드" value={cards.yellowred} max={5} />
          <StatBar label="레드카드" value={cards.red} max={5} />
        </div>
      );
      case 'fpl': return fplExtra ? (
        <div>
          <div className="text-xs text-blue-400 mb-3">FPL 영향력 지수</div>
          <StatBar label="ICT 인덱스" value={fplExtra.ictIndex} max={500} />
          <StatBar label="영향력 (Influence)" value={fplExtra.influence} max={1500} />
          <StatBar label="창의력 (Creativity)" value={fplExtra.creativity} max={1500} />
          <StatBar label="위협 (Threat)" value={fplExtra.threat} max={2000} />
          <div className="mt-3 pt-3 border-t border-[#3a3939] flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-xl font-bold">{fplExtra.form?.toFixed(1) ?? '-'}</div>
              <div className="text-xs text-gray-500">폼</div>
            </div>
            {fplExtra.xgPer90 != null && (
              <div className="text-center">
                <div className="text-xl font-bold">{fplExtra.xgPer90.toFixed(2)}</div>
                <div className="text-xs text-gray-500">xG/90</div>
              </div>
            )}
            {fplExtra.xaPer90 != null && (
              <div className="text-center">
                <div className="text-xl font-bold">{fplExtra.xaPer90.toFixed(2)}</div>
                <div className="text-xs text-gray-500">xA/90</div>
              </div>
            )}
          </div>
        </div>
      ) : null;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.key ? 'bg-red-700 text-white' : 'bg-[#2e2d2d] text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
};

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
interface ApiPlayer {
  id: number; name: string; age: number;
  birth?: { date?: string; country?: string };
  nationality?: string; height?: string; weight?: string; photo?: string;
}
interface ApiStats {
  games?: { appearences?: number; appearances?: number; minutes?: number; rating?: string; position?: string };
  goals?: { total?: number; assists?: number; saves?: number; conceded?: number };
  shots?: { total?: number; on?: number };
  passes?: { total?: number; key?: number; accuracy?: number };
  tackles?: { total?: number; blocks?: number; interceptions?: number };
  duels?: { total?: number; won?: number };
  dribbles?: { attempts?: number; success?: number };
  fouls?: { drawn?: number; committed?: number };
  cards?: { yellow?: number; yellowred?: number; red?: number };
  penalty?: { scored?: number; missed?: number };
}
interface PlayerDbRow {
  playerId: number; name: string; age?: number; shirtNumber?: number;
  nationality?: string; position?: string; photo?: string;
}
interface FplExtra {
  starts?: number; minutes?: number; goals?: number; assists?: number; cleanSheets?: number;
  yellow?: number; red?: number; saves?: number; xg?: number; xa?: number; xgi?: number;
  xgPer90?: number; xaPer90?: number; tackles?: number; cbi?: number; recoveries?: number;
  influence?: number; creativity?: number; threat?: number; ictIndex?: number; form?: number;
}
interface DetailData {
  playerDb?: PlayerDbRow;
  player?: ApiPlayer;
  stats?: ApiStats & { xg?: number; xa?: number; xgi?: number; cleanSheets?: number; cbi?: number; recoveries?: number; ictIndex?: number; influence?: number; creativity?: number; threat?: number; form?: number };
  fplExtra?: FplExtra | null;
  source?: string;
  season?: string;
}

const HEAT_MODES: { key: HeatMode; label: string }[] = [
  { key: 'activity', label: '활동 영역' },
  { key: 'attack',   label: '공격 지대' },
  { key: 'defense',  label: '수비 지대' },
];

const posColor: Record<string, string> = {
  Goalkeeper: 'bg-yellow-600', Defender: 'bg-blue-700',
  Midfielder: 'bg-green-700', Attacker: 'bg-red-700', Forward: 'bg-red-700',
};

const PlayerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatMode, setHeatMode] = useState<HeatMode>('activity');

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/players/${id}/stats`)
      .then(r => setData(r.data))
      .catch(() => setError('선수 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-gray-400 animate-pulse">
      선수 정보 로딩 중...
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center flex-col gap-4 py-32">
      <p className="text-red-400">{error ?? '데이터 없음'}</p>
      <button onClick={() => navigate('/squad')} className="px-4 py-2 bg-[#2e2d2d] text-gray-300 rounded-lg">
        ← 선수단으로
      </button>
    </div>
  );

  const db = data.playerDb;
  const api = data.player;
  const stats = data.stats;

  const name = db?.name ?? api?.name ?? '';
  // 정식 이름 결정: playerId 맵 → 약어 맵 → 원본 순서로 폴백
  const canonicalName: string =
    (db?.playerId && playerIdToFullName[db.playerId as number]) ||
    abbreviatedToFullName[name] ||
    name;

  const nameKo     = playerNameKoMap[canonicalName] ?? playerNameKoMap[name] ?? name;
  const position   = db?.position ?? (stats?.games as any)?.position ?? 'Midfielder';
  const positionKo = positionKoMap[position] ?? position;
  const nationality   = db?.nationality ?? api?.nationality ?? '';
  const nationalityKo = nationalityKoMap[nationality] ?? nationality;
  const photo      = db?.photo ?? api?.photo ?? '';
  const number     = db?.shirtNumber;
  const age        = db?.age ?? api?.age;
  const height     = api?.height ?? '';
  const weight     = api?.weight ?? '';
  const subPos      = playerSubPositionMap[canonicalName] ?? playerSubPositionMap[name] ?? position;
  const subPosLabel = subPositionLabel[subPos] ?? positionKo;

  // API 스탯이 없거나 핵심값이 모두 0이면 더미 스탯 사용
  const isStatsEmpty =
    !stats ||
    ((stats?.goals?.total ?? 0) === 0 &&
      (stats?.goals?.assists ?? 0) === 0 &&
      (stats?.shots?.total ?? 0) === 0 &&
      ((stats?.games as any)?.appearances ?? (stats?.games as any)?.appearences ?? 0) === 0);
  const effectiveStats = (isStatsEmpty && playerDummyStats[canonicalName])
    ? playerDummyStats[canonicalName]
    : stats;

  const g       = (effectiveStats?.games ?? {}) as any;
  const apps    = g.appearences ?? g.appearances ?? 0;
  const goals   = effectiveStats?.goals?.total ?? 0;
  const assists = effectiveStats?.goals?.assists ?? 0;
  const ratingRaw = g.rating;
  const rating  = ratingRaw ? parseFloat(ratingRaw).toFixed(2) : '-';
  const minutes = g.minutes ?? 0;

  return (
    <div className="pb-10">
      {/* 뒤로가기 */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/squad')} className="text-gray-400 hover:text-white text-sm transition-colors">
              ← 선수단으로
            </button>
            <button
              onClick={() => navigate(`/compare?a=${db?.playerId ?? ''}`)}
              className="ml-auto text-xs bg-[#2e2d2d] hover:bg-[#3a3a3a] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              ⚖️ 선수 비교
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl pt-5">

        {/* 프로필 헤더 */}
        <div className="bg-[#272727] rounded-2xl overflow-hidden mb-5">
          <div className="h-1 bg-gradient-to-r from-red-800 via-red-500 to-red-800" />
          <div className="p-5 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* 사진 */}
            <div className="relative flex-shrink-0">
              {number != null && (
                <div className="absolute -top-2 -left-2 z-10 bg-red-700 text-white font-bold text-sm w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#272727]">
                  {number}
                </div>
              )}
              <div className="w-36 h-36 bg-[#333] rounded-2xl overflow-hidden flex items-end justify-center">
                {photo ? (
                  <img src={photo} alt={nameKo} className="h-full w-full object-contain object-bottom"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <svg className="w-16 h-16 text-gray-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${posColor[position] ?? 'bg-gray-600'}`}>
                  {subPosLabel}
                </span>
                {nationality && (
                  <span className="text-xs text-gray-400 bg-[#333] px-2.5 py-1 rounded-full">{nationalityKo}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">{nameKo}</h1>
              {nameKo !== name && <p className="text-gray-500 text-sm mb-2">{name}</p>}
              <div className="flex flex-wrap gap-3 text-sm text-gray-400 justify-center sm:justify-start">
                {age && <span>만 {age}세</span>}
                {height && <span>{height}</span>}
                {weight && <span>{weight}</span>}
                <span className="text-gray-600">{data.season ?? '2025-26'} 시즌</span>
              </div>
            </div>

            {/* 뱃지 */}
            <div className="flex-shrink-0">
              <img src="https://crests.football-data.org/66.png" alt="Man United" className="w-14 h-14 opacity-75" />
            </div>
          </div>
        </div>

        {/* 핵심 스탯 카드 */}
        <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
          {data.source === 'fpl' && data.fplExtra ? (
            <>
              <StatCard value={data.fplExtra.starts ?? apps} label="선발" sub={`${data.fplExtra.minutes ?? minutes}분`} />
              <StatCard value={goals} label="골" />
              <StatCard value={assists} label="어시스트" />
              <StatCard value={data.fplExtra.xg?.toFixed(1) ?? '-'} label="xG" />
              {data.fplExtra.ictIndex != null && <StatCard value={data.fplExtra.ictIndex.toFixed(0)} label="ICT" />}
            </>
          ) : (
            <>
              <StatCard value={apps} label="출전" sub={minutes ? `${minutes}분` : undefined} />
              <StatCard value={goals} label="골" />
              <StatCard value={assists} label="어시스트" />
              <StatCard value={rating} label="평점" />
            </>
          )}
        </div>

        {/* 레이더 차트 + 히트맵 + 스탯 */}
        {/* 레이더 차트 (전체 너비) */}
        <div className="bg-[#272727] rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold text-sm">능력치 레이더</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-red-500 rounded" />선수</span>
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 border-t border-dashed border-gray-400" />팀 평균</span>
            </div>
          </div>
          <RadarChart playerName={canonicalName} />
          {/* 하단 수치 요약 */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {RADAR_LABELS.map((label, i) => {
              const val = (playerRadarData[canonicalName] ?? RADAR_AVG)[i];
              const avg = RADAR_AVG[i];
              return (
                <div key={label} className="bg-[#333] rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-white font-bold text-sm">{val}</span>
                    <span className={`text-xs font-medium ${val >= avg ? 'text-green-400' : 'text-red-400'}`}>
                      {val >= avg ? `+${val - avg}` : `${val - avg}`}
                    </span>
                  </div>
                  <div className="mt-1 h-1 bg-[#444] rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 히트맵 카드 */}
          <div className="bg-[#272727] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm">포지션 히트맵</h2>
              <span className="text-xs text-gray-500">{subPosLabel}</span>
            </div>

            {/* 모드 버튼 */}
            <div className="flex gap-1.5 mb-3">
              {HEAT_MODES.map(m => (
                <button key={m.key} onClick={() => setHeatMode(m.key)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    heatMode === m.key
                      ? 'bg-red-700 text-white'
                      : 'bg-[#333] text-gray-400 hover:text-white'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>

            <Heatmap subPos={subPos} mode={heatMode} playerName={canonicalName} />

            {/* 범례 */}
            <div className="mt-3 flex items-center justify-center gap-1 text-xs">
              {['#0050ff', '#00d4a0', '#80ff00', '#ffe000', '#ff6e00', '#ff0a00'].map((c, i) => (
                <div key={i} className="w-6 h-2.5 rounded-sm" style={{ background: c }} />
              ))}
              <span className="text-gray-500 ml-1">낮음 → 높음</span>
            </div>
          </div>

          {/* 세부 스탯 */}
          <div className="bg-[#272727] rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 text-sm">세부 스탯</h2>
            {effectiveStats ? (
              <StatTabs stats={effectiveStats} position={position} source={data.source} fplExtra={data.fplExtra} />
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">스탯 데이터 없음</div>
            )}
          </div>
        </div>

        {/* 경기당 평균 */}
        {effectiveStats && apps > 0 && (
          <div className="mt-5 bg-[#272727] rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 text-sm">경기당 평균</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '슈팅/경기', value: ((effectiveStats.shots?.total ?? 0) / apps).toFixed(1) },
                { label: '키패스/경기', value: ((effectiveStats.passes?.key ?? 0) / apps).toFixed(1) },
                { label: '태클/경기', value: ((effectiveStats.tackles?.total ?? 0) / apps).toFixed(1) },
                { label: '듀얼/경기', value: ((effectiveStats.duels?.total ?? 0) / apps).toFixed(1) },
              ].map(item => (
                <div key={item.label} className="bg-[#333] rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetailPage;
