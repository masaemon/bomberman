import { GameMap } from '../map/GameMap';
import { Enemy } from '../entities/Enemy';

/**
 * AIの状態
 */
enum AIState {
  IDLE,
  ROAMING,      // 通常移動
  CHASING,      // プレイヤー追跡
  FLEEING,      // 逃げる（爆弾設置後）
  BOMBING,      // 爆弾設置
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
 * 戦略的AIクラス
 * - プレイヤー追跡
 * - 爆弾回避
 * - 戦略的な爆弾設置
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

  // 爆弾設置リクエスト
  private wantToPlaceBomb: boolean = false;

  // プレイヤー位置（GameSceneから更新される）
  private playerTile: { x: number; y: number } | null = null;

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
   * 通常移動モード
   */
  private updateRoaming(delta: number): void {
    this.stateTimer += delta;

    // 現在位置が危険なら逃げる
    if (this.isInDanger()) {
      this.state = AIState.FLEEING;
      this.fleeTimer = 0;
      return;
    }

    // プレイヤーが近くにいたら追跡モードへ
    if (this.playerTile && this.getDistanceToPlayer() < 8) {
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
  }

  /**
   * プレイヤー追跡モード
   */
  private updateChasing(delta: number): void {
    this.stateTimer += delta;

    // 危険なら逃げる
    if (this.isInDanger()) {
      this.state = AIState.FLEEING;
      this.fleeTimer = 0;
      return;
    }

    // プレイヤーが遠くなったら通常モードへ
    if (!this.playerTile || this.getDistanceToPlayer() > 12) {
      this.state = AIState.ROAMING;
      this.stateTimer = 0;
      return;
    }

    // プレイヤーに向かう方向を計算
    this.moveTowardsPlayer();

    // プレイヤーが近くにいて、爆弾設置可能なら設置
    if (this.getDistanceToPlayer() <= 3 && this.bombCooldown <= 0) {
      if (this.shouldPlaceBomb()) {
        this.wantToPlaceBomb = true;
        this.bombCooldown = 3000; // 3秒のクールダウン
        this.state = AIState.FLEEING;
        this.fleeTimer = 0;
      }
    }

    // 一定間隔で方向を再計算
    if (this.stateTimer > 500) {
      this.stateTimer = 0;
      this.moveTowardsPlayer();
    }
  }

  /**
   * 逃げるモード（爆弾設置後）
   */
  private updateFleeing(delta: number): void {
    this.fleeTimer += delta;

    // 安全になったら通常モードへ
    if (!this.isInDanger() && this.fleeTimer > 2000) {
      this.state = AIState.ROAMING;
      this.stateTimer = 0;
      return;
    }

    // 安全な方向を探す
    this.moveToSafety();
  }

  /**
   * プレイヤーとの距離を取得
   */
  private getDistanceToPlayer(): number {
    if (!this.playerTile) return Infinity;

    const enemyTile = this.enemy.getTilePosition();
    const dx = this.playerTile.x - enemyTile.x;
    const dy = this.playerTile.y - enemyTile.y;
    return Math.abs(dx) + Math.abs(dy);
  }

  /**
   * プレイヤーに向かって移動
   */
  private moveTowardsPlayer(): void {
    if (!this.playerTile) return;

    const enemyTile = this.enemy.getTilePosition();

    // 最適な方向を選択（A*ライクな経路探索を簡略化）
    const possibleMoves = this.getValidMoves();

    if (possibleMoves.length === 0) {
      this.moveDirection = { x: 0, y: 0 };
      return;
    }

    // プレイヤーに最も近づける方向を選ぶ
    let bestMove = possibleMoves[0];
    let bestScore = Infinity;

    for (const move of possibleMoves) {
      const newX = enemyTile.x + move.x;
      const newY = enemyTile.y + move.y;

      // 危険なタイルは避ける
      if (this.isDangerousTile(newX, newY)) continue;

      const newDx = this.playerTile.x - newX;
      const newDy = this.playerTile.y - newY;
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
   * 爆弾を設置すべきか判断
   */
  private shouldPlaceBomb(): boolean {
    if (!this.enemy.canPlaceBomb()) return false;

    const enemyTile = this.enemy.getTilePosition();

    // 設置後に逃げられるかチェック
    const escapeRoutes = this.getValidMoves().filter(move => {
      const newX = enemyTile.x + move.x;
      const newY = enemyTile.y + move.y;
      return !this.isDangerousTile(newX, newY);
    });

    // 逃げ道がなければ設置しない
    if (escapeRoutes.length === 0) return false;

    // プレイヤーが爆発範囲内にいるかチェック
    if (this.playerTile) {
      const dx = Math.abs(this.playerTile.x - enemyTile.x);
      const dy = Math.abs(this.playerTile.y - enemyTile.y);

      // 同じ行または列にいて、爆発範囲内
      if ((dx === 0 && dy <= this.enemy.bombRange) ||
          (dy === 0 && dx <= this.enemy.bombRange)) {
        return true;
      }
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
   * プレイヤー位置を設定（GameSceneから呼び出し）
   */
  setPlayerPosition(tile: { x: number; y: number }): void {
    this.playerTile = tile;
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
