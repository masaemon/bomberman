import { GameMap } from '../map/GameMap';
import { Enemy } from '../entities/Enemy';

/**
 * AIの状態
 */
enum AIState {
  ROAMING,      // 通常移動（壁を壊しながら探索）
  CHASING,      // ターゲット追跡
  FLEEING,      // 逃げる（爆弾設置後）
}

/**
 * 方向の定義
 */
const DIRECTIONS = [
  { x: 0, y: -1 },  // 上
  { x: 0, y: 1 },   // 下
  { x: -1, y: 0 },  // 左
  { x: 1, y: 0 },   // 右
];

/**
 * ターゲット情報
 */
interface Target {
  x: number;
  y: number;
  isPlayer: boolean;
}

/**
 * 戦略的AIクラス
 * - プレイヤーと他の敵を攻撃
 * - 積極的な爆弾設置
 * - 爆弾回避
 */
export class SimpleAI {
  private enemy: Enemy;
  private gameMap: GameMap;

  // AI状態
  private state: AIState = AIState.ROAMING;

  // 移動方向
  private moveDirection: { x: number; y: number } = { x: 0, y: 0 };

  // タイマー
  private stateTimer: number = 0;
  private bombCooldown: number = 0;
  private fleeTimer: number = 0;
  private roamingBombTimer: number = 0;

  // 爆弾設置リクエスト
  private wantToPlaceBomb: boolean = false;

  // ターゲット情報
  private targets: Target[] = [];

  // 危険なタイル（爆弾・爆発範囲）
  private dangerousTiles: Set<string> = new Set();

  constructor(enemy: Enemy, gameMap: GameMap) {
    this.enemy = enemy;
    this.gameMap = gameMap;
    this.chooseNewDirection();
  }

  /**
   * 更新処理
   */
  update(delta: number): void {
    if (!this.enemy.isAlive) return;

    // クールダウン更新
    this.bombCooldown = Math.max(0, this.bombCooldown - delta);
    this.roamingBombTimer += delta;

    // 状態に応じた行動
    switch (this.state) {
      case AIState.ROAMING:
        this.updateRoaming(delta);
        break;
      case AIState.CHASING:
        this.updateChasing(delta);
        break;
      case AIState.FLEEING:
        this.updateFleeing(delta);
        break;
    }
  }

  /**
   * 通常移動モード（積極的に探索・爆弾設置）
   */
  private updateRoaming(delta: number): void {
    this.stateTimer += delta;

    // 現在位置が危険なら逃げる
    if (this.isInDanger()) {
      this.state = AIState.FLEEING;
      this.fleeTimer = 0;
      return;
    }

    // ターゲットが近くにいたら追跡モードへ
    const nearestTarget = this.findNearestTarget();
    if (nearestTarget && this.getDistanceToTarget(nearestTarget) < 10) {
      this.state = AIState.CHASING;
      this.stateTimer = 0;
      return;
    }

    // 一定間隔で方向変更
    if (this.stateTimer > 1500) {
      this.stateTimer = 0;
      this.chooseNewDirection();
    }

    // 壁にぶつかったら方向変更
    if (!this.canMoveInDirection(this.moveDirection)) {
      this.chooseNewDirection();
    }

    // 積極的に爆弾を設置（2秒ごとに30%の確率）
    if (this.roamingBombTimer > 2000 && this.bombCooldown <= 0) {
      this.roamingBombTimer = 0;
      if (Math.random() < 0.3) {
        if (this.canPlaceBombSafely()) {
          this.wantToPlaceBomb = true;
          this.bombCooldown = 2500;
          this.state = AIState.FLEEING;
          this.fleeTimer = 0;
        }
      }
    }

    // 近くに破壊可能な壁があれば爆弾設置
    if (this.bombCooldown <= 0 && this.hasBreakableWallNearby()) {
      if (this.canPlaceBombSafely()) {
        this.wantToPlaceBomb = true;
        this.bombCooldown = 2500;
        this.state = AIState.FLEEING;
        this.fleeTimer = 0;
      }
    }
  }

  /**
   * ターゲット追跡モード
   */
  private updateChasing(delta: number): void {
    this.stateTimer += delta;

    // 危険なら逃げる
    if (this.isInDanger()) {
      this.state = AIState.FLEEING;
      this.fleeTimer = 0;
      return;
    }

    // ターゲットを探す
    const target = this.findNearestTarget();

    // ターゲットがいない、または遠くなったら通常モードへ
    if (!target || this.getDistanceToTarget(target) > 15) {
      this.state = AIState.ROAMING;
      this.stateTimer = 0;
      return;
    }

    // ターゲットに向かう方向を計算
    this.moveTowardsTarget(target);

    // ターゲットが近くにいて、爆弾設置可能なら設置
    const distance = this.getDistanceToTarget(target);
    if (distance <= 4 && this.bombCooldown <= 0) {
      if (this.shouldPlaceBombForTarget(target)) {
        this.wantToPlaceBomb = true;
        this.bombCooldown = 2000;
        this.state = AIState.FLEEING;
        this.fleeTimer = 0;
      }
    }

    // 一定間隔で方向を再計算
    if (this.stateTimer > 400) {
      this.stateTimer = 0;
      this.moveTowardsTarget(target);
    }
  }

  /**
   * 逃げるモード（爆弾設置後）
   */
  private updateFleeing(delta: number): void {
    this.fleeTimer += delta;

    // 安全になったら通常モードへ
    if (!this.isInDanger() && this.fleeTimer > 1500) {
      this.state = AIState.ROAMING;
      this.stateTimer = 0;
      return;
    }

    // 安全な方向を探す
    this.moveToSafety();
  }

  /**
   * 最も近いターゲットを探す
   */
  private findNearestTarget(): Target | null {
    if (this.targets.length === 0) return null;

    let nearest: Target | null = null;
    let minDistance = Infinity;

    for (const target of this.targets) {
      const distance = this.getDistanceToTarget(target);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = target;
      }
    }

    return nearest;
  }

  /**
   * ターゲットとの距離を取得
   */
  private getDistanceToTarget(target: Target): number {
    const enemyTile = this.enemy.getTilePosition();
    const dx = target.x - enemyTile.x;
    const dy = target.y - enemyTile.y;
    return Math.abs(dx) + Math.abs(dy);
  }

  /**
   * ターゲットに向かって移動
   */
  private moveTowardsTarget(target: Target): void {
    const enemyTile = this.enemy.getTilePosition();
    const possibleMoves = this.getValidMoves();

    if (possibleMoves.length === 0) {
      this.moveDirection = { x: 0, y: 0 };
      return;
    }

    // ターゲットに最も近づける方向を選ぶ
    let bestMove = possibleMoves[0];
    let bestScore = Infinity;

    for (const move of possibleMoves) {
      const newX = enemyTile.x + move.x;
      const newY = enemyTile.y + move.y;

      // 危険なタイルは避ける
      if (this.isDangerousTile(newX, newY)) continue;

      const newDx = target.x - newX;
      const newDy = target.y - newY;
      const score = Math.abs(newDx) + Math.abs(newDy);

      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    this.moveDirection = bestMove;
  }

  /**
   * 安全な場所へ移動
   */
  private moveToSafety(): void {
    const enemyTile = this.enemy.getTilePosition();
    const possibleMoves = this.getValidMoves();

    if (possibleMoves.length === 0) {
      this.moveDirection = { x: 0, y: 0 };
      return;
    }

    // 危険から最も遠い方向を選ぶ
    let bestMove = possibleMoves[0];
    let bestSafety = -Infinity;

    for (const move of possibleMoves) {
      const newX = enemyTile.x + move.x;
      const newY = enemyTile.y + move.y;

      // 危険なタイルは避ける
      if (this.isDangerousTile(newX, newY)) continue;

      // 安全度を計算（危険なタイルからの距離）
      const safety = this.calculateSafetyScore(newX, newY);

      if (safety > bestSafety) {
        bestSafety = safety;
        bestMove = move;
      }
    }

    this.moveDirection = bestMove;
  }

  /**
   * 安全度スコアを計算
   */
  private calculateSafetyScore(tileX: number, tileY: number): number {
    let minDistance = Infinity;

    for (const tileKey of this.dangerousTiles) {
      const [dx, dy] = tileKey.split(',').map(Number);
      const distance = Math.abs(tileX - dx) + Math.abs(tileY - dy);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  /**
   * 近くに破壊可能な壁があるか
   */
  private hasBreakableWallNearby(): boolean {
    const tile = this.enemy.getTilePosition();
    const range = this.enemy.bombRange;

    for (const dir of DIRECTIONS) {
      for (let i = 1; i <= range; i++) {
        const tx = tile.x + dir.x * i;
        const ty = tile.y + dir.y * i;

        const tileType = this.gameMap.getTileAt(tx, ty);
        if (tileType === 1) break; // 壁
        if (tileType === 2) return true; // 破壊可能な壁
      }
    }

    return false;
  }

  /**
   * 安全に爆弾を設置できるか
   */
  private canPlaceBombSafely(): boolean {
    if (!this.enemy.canPlaceBomb()) return false;

    const enemyTile = this.enemy.getTilePosition();

    // 設置後に逃げられるかチェック
    const escapeRoutes = this.getValidMoves().filter(move => {
      const newX = enemyTile.x + move.x;
      const newY = enemyTile.y + move.y;
      // 現在の危険タイルと、新しい爆弾の爆発範囲を考慮
      return !this.isDangerousTile(newX, newY) && !this.wouldBeInBlastRange(newX, newY, enemyTile);
    });

    return escapeRoutes.length > 0;
  }

  /**
   * 指定位置が爆弾の爆発範囲に入るか
   */
  private wouldBeInBlastRange(x: number, y: number, bombPos: { x: number; y: number }): boolean {
    const range = this.enemy.bombRange;

    // 同じ行または列にいて、範囲内かチェック
    if (x === bombPos.x && Math.abs(y - bombPos.y) <= range) return true;
    if (y === bombPos.y && Math.abs(x - bombPos.x) <= range) return true;

    return false;
  }

  /**
   * ターゲットに対して爆弾を設置すべきか判断
   */
  private shouldPlaceBombForTarget(target: Target): boolean {
    if (!this.canPlaceBombSafely()) return false;

    const enemyTile = this.enemy.getTilePosition();
    const dx = Math.abs(target.x - enemyTile.x);
    const dy = Math.abs(target.y - enemyTile.y);
    const range = this.enemy.bombRange;

    // 同じ行または列にいて、爆発範囲内
    if ((dx === 0 && dy <= range) || (dy === 0 && dx <= range)) {
      return true;
    }

    // ターゲットが近くにいれば、とにかく爆弾を置く
    if (dx + dy <= 3) {
      return true;
    }

    return false;
  }

  /**
   * 指定タイルが危険かどうか
   */
  private isDangerousTile(tileX: number, tileY: number): boolean {
    return this.dangerousTiles.has(`${tileX},${tileY}`);
  }

  /**
   * 現在位置が危険かどうか
   */
  private isInDanger(): boolean {
    const tile = this.enemy.getTilePosition();
    return this.isDangerousTile(tile.x, tile.y);
  }

  /**
   * 指定方向に移動可能か
   */
  private canMoveInDirection(dir: { x: number; y: number }): boolean {
    const tile = this.enemy.getTilePosition();
    return this.gameMap.isWalkable(tile.x + dir.x, tile.y + dir.y);
  }

  /**
   * 移動可能な方向のリスト
   */
  private getValidMoves(): { x: number; y: number }[] {
    return DIRECTIONS.filter(dir => this.canMoveInDirection(dir));
  }

  /**
   * 新しい移動方向を選択（ランダム）
   */
  private chooseNewDirection(): void {
    const validMoves = this.getValidMoves();

    if (validMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * validMoves.length);
      this.moveDirection = validMoves[randomIndex];
    } else {
      this.moveDirection = { x: 0, y: 0 };
    }
  }

  /**
   * 危険なタイルを設定（GameSceneから呼び出し）
   */
  setDangerousTiles(tiles: Set<string>): void {
    this.dangerousTiles = tiles;
  }

  /**
   * ターゲット位置を設定（GameSceneから呼び出し）
   * プレイヤーと他の敵の位置を含む
   */
  setTargets(targets: Target[]): void {
    // 自分自身は除外
    const myTile = this.enemy.getTilePosition();
    this.targets = targets.filter(t => t.x !== myTile.x || t.y !== myTile.y);
  }

  /**
   * プレイヤー位置を設定（互換性のため維持）
   */
  setPlayerPosition(_tile: { x: number; y: number }): void {
    // setTargetsを使うようになったので、互換性のためだけに維持
  }

  /**
   * 現在の移動方向を取得
   */
  getMoveDirection(): { x: number; y: number } {
    return this.moveDirection;
  }

  /**
   * 爆弾設置リクエストをチェック
   */
  checkBombRequest(): boolean {
    if (this.wantToPlaceBomb) {
      this.wantToPlaceBomb = false;
      return true;
    }
    return false;
  }
}
