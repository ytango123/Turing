#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
音频答题数据提取脚本
从用户游戏数据中提取每个音频的答题统计信息
"""

import json
from collections import defaultdict

def extract_audio_stats(input_file, output_file):
    """
    从用户数据文件中提取音频答题统计
    
    Args:
        input_file: 输入的users.jsonl文件路径
        output_file: 输出的音频统计jsonl文件路径
    """
    # 用于存储每个音频的统计信息
    audio_stats = defaultdict(lambda: {'total': 0, 'correct': 0})
    
    print(f"正在读取文件: {input_file}")
    
    # 读取用户数据
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                user_data = json.loads(line.strip())
                
                # 检查是否有游戏数据
                if 'gameData' not in user_data:
                    continue
                    
                game_data = user_data['gameData']
                
                # 检查是否有历史记录
                if 'history' not in game_data:
                    continue
                    
                # 遍历所有历史挑战记录
                for challenge in game_data['history']:
                    if 'dialogues' not in challenge:
                        continue
                        
                    # 遍历每轮挑战中的所有音频对话
                    for dialogue in challenge['dialogues']:
                        if 'name' not in dialogue or 'isCorrect' not in dialogue:
                            continue
                            
                        audio_name = dialogue['name']
                        is_correct = dialogue['isCorrect']
                        
                        # 统计总答题次数
                        audio_stats[audio_name]['total'] += 1
                        
                        # 统计正确次数
                        if is_correct:
                            audio_stats[audio_name]['correct'] += 1
                            
            except json.JSONDecodeError as e:
                print(f"警告: 第{line_num}行JSON解析错误: {e}")
                continue
            except Exception as e:
                print(f"警告: 第{line_num}行处理错误: {e}")
                continue
    
    print(f"共处理了 {len(audio_stats)} 个不同的音频")
    
    # 写入结果到输出文件
    with open(output_file, 'w', encoding='utf-8') as f:
        for audio_name, stats in audio_stats.items():
            result = {
                'name': audio_name,
                'total': stats['total'],
                'correct': stats['correct']
            }
            f.write(json.dumps(result, ensure_ascii=False) + '\n')
    
    print(f"结果已保存到: {output_file}")
    
    # 打印一些统计信息
    total_responses = sum(stats['total'] for stats in audio_stats.values())
    total_correct = sum(stats['correct'] for stats in audio_stats.values())
    overall_accuracy = (total_correct / total_responses * 100) if total_responses > 0 else 0
    
    print(f"\n统计摘要:")
    print(f"- 不同音频数量: {len(audio_stats)}")
    print(f"- 总答题次数: {total_responses}")
    print(f"- 总正确次数: {total_correct}")
    print(f"- 整体正确率: {overall_accuracy:.2f}%")
    
    # 显示答题次数最多的前10个音频
    sorted_audios = sorted(audio_stats.items(), key=lambda x: x[1]['total'], reverse=True)
    print(f"\n答题次数最多的前10个音频:")
    for i, (name, stats) in enumerate(sorted_audios[:10], 1):
        accuracy = (stats['correct'] / stats['total'] * 100) if stats['total'] > 0 else 0
        print(f"{i:2d}. {name}: {stats['total']}次答题, {stats['correct']}次正确, 正确率{accuracy:.1f}%")

if __name__ == "__main__":
    input_file = "users.jsonl"
    output_file = "audio_stats.jsonl"
    
    try:
        extract_audio_stats(input_file, output_file)
    except FileNotFoundError:
        print(f"错误: 找不到输入文件 {input_file}")
    except Exception as e:
        print(f"错误: {e}") 